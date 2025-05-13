import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/environment';
import { apiService } from '../services/api';

// Define user interface based on backend response
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photo?: string | null;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  tokenExpires: number | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  resetError: () => void;
}

// Helper function to parse backend error messages
const parseBackendError = (error: any): string => {
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }

  const { status, data } = error.response;

  // Handle specific error status codes
  if (status === 401) {
    return 'Unauthorized access. Please login again.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (status === 404) {
    return 'Resource not found.';
  }

  if (status === 422) {
    // Handle validation errors
    if (data.errors) {
      // Check for specific validation errors
      if (data.errors.email) {
        if (data.errors.email === 'notFound') {
          return 'notFound';
        } else if (data.errors.email.includes('needLoginViaProvider')) {
          return data.errors.email;
        } else if (data.errors.email === 'emailExists') {
          return 'emailExists';
        } else if (data.errors.email === 'emailNotExists') {
          return 'emailNotExists';
        }
        return `Email error: ${data.errors.email}`;
      }

      if (data.errors.password) {
        if (data.errors.password === 'incorrectPassword') {
          return 'incorrectPassword';
        }
        return `Password error: ${data.errors.password}`;
      }

      // Return the first error message if there are multiple
      const firstErrorKey = Object.keys(data.errors)[0];
      if (firstErrorKey) {
        return `${firstErrorKey}: ${data.errors[firstErrorKey]}`;
      }
    }
  }

  // Default error message
  return data?.message || 'An unexpected error occurred. Please try again.';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      tokenExpires: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await axios.post(`${API_URL}/auth/email/login`, {
            email,
            password,
          });
          
          const { token, refreshToken, tokenExpires, user } = response.data;
          
          set({
            token,
            refreshToken,
            tokenExpires,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = parseBackendError(error);
          console.error('Login error:', errorMessage);
          set({ isLoading: false, error: errorMessage });
        }
      },
      
      register: async (email: string, password: string, firstName: string, lastName: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await axios.post(`${API_URL}/auth/email/register`, {
            email,
            password,
            firstName,
            lastName,
          });
          
          // After registration, automatically log in
          await get().login(email, password);
        } catch (error) {
          const errorMessage = parseBackendError(error);
          console.error('Registration error:', errorMessage);
          set({ isLoading: false, error: errorMessage });
        }
      },
      
      logout: async () => {
        try {
          const { token } = get();
          
          if (token) {
            await axios.post(
              `${API_URL}/auth/logout`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            token: null,
            refreshToken: null,
            tokenExpires: null,
            user: null,
            isAuthenticated: false,
          });
        }
      },
      
      refreshTokens: async () => {
        try {
          const { refreshToken } = get();
          
          if (!refreshToken) {
            return false;
          }
          
          const response = await axios.post(
            `${API_URL}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );
          
          const { token, refreshToken: newRefreshToken, tokenExpires } = response.data;
          
          set({
            token,
            refreshToken: newRefreshToken,
            tokenExpires,
            isAuthenticated: true,
          });
          
          return true;
        } catch (error) {
          console.error('Token refresh error:', error);
          set({
            token: null,
            refreshToken: null,
            tokenExpires: null,
            user: null,
            isAuthenticated: false,
          });
          
          return false;
        }
      },
      
      resetError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 
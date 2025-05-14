import { apiService } from './api';
import axios from 'axios';
import { API_URL } from '../config/environment';
import { useAuthStore } from '../stores/auth-store';

// Challenge Response type
export interface ChallengeResponseDto {
  success: boolean;
  message: string;
  score: number;
  isMatch: boolean;
  detectedClass: string;
  streakIncreased: boolean;
  currentStreak: number;
  unlockedAchievements?: string[];
}

// Today's Challenge type
export interface TodayChallengeDto {
  id: string;
  title: string;
  description: string;
  class: string;
  createdAt: string;
  expiresAt: string;
  isCompleted: boolean;
  currentStreak: number;
}

// Achievement item for history
export interface AchievementItem {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
}

// Challenge history item for history
export interface ChallengeHistoryItem {
  id: string;
  description: string;
  class: string;
  createdAt: string;
  isCompleted: boolean;
  completedAt?: string;
  score?: number;
  photoId?: string;
}

// Challenge history response
export interface ChallengeHistoryDto {
  currentStreak: number;
  highestStreak: number;
  totalCompleted: number;
  totalAttempted: number;
  achievements: AchievementItem[];
  history: ChallengeHistoryItem[];
}

class ChallengeService {
  /**
   * Get today's challenge
   */
  async getTodayChallenge(): Promise<TodayChallengeDto> {
    // Lấy ID người dùng và chuyển đổi sang chuỗi
    const user = useAuthStore.getState().user;
    if (!user || !user.id) {
      throw new Error('User ID is required to get today\'s challenge');
    }
    
    // Đảm bảo kiểu dữ liệu là string
    const userId = user.id.toString();
    
    console.log(`[Challenge] Getting today's challenge for user ${userId}, API URL: ${API_URL}`);
    try {
      const endpoint = `/challenges/today/${userId}`;
      console.log(`[Challenge] Calling endpoint: ${endpoint}`);
      
      const result = await apiService.get<TodayChallengeDto>(endpoint);
      console.log('[Challenge] Today\'s challenge received:', result);
      return result;
    } catch (error) {
      console.error('[Challenge] Error getting today\'s challenge:', error);
      if (axios.isAxiosError(error)) {
        console.error('[Challenge] Response status:', error.response?.status);
        console.error('[Challenge] Response data:', error.response?.data);
        console.error('[Challenge] Request config:', {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
        });
      }
      throw error;
    }
  }

  /**
   * Submit a challenge photo
   */
  async submitChallenge(
    photoUri: string,
    challengeId?: string
  ): Promise<ChallengeResponseDto> {
    const user = useAuthStore.getState().user;
    if (!user || !user.id) {
      throw new Error('User ID is required to submit a challenge');
    }
    
    // Đảm bảo kiểu dữ liệu là string
    const userId = user.id.toString();
    
    console.log(`[Challenge] Submitting challenge for user ${userId}`, { 
      hasPhotoUri: !!photoUri, 
      challengeId,
      apiUrl: API_URL
    });
    
    const formData = new FormData();
    
    // Add photo file
    if (photoUri) {
      // Get filename from URI
      const uriParts = photoUri.split('/');
      const fileName = uriParts[uriParts.length - 1];
      
      console.log(`[Challenge] Preparing photo: ${fileName}`);
      
      // Create file object for upload
      const fileToUpload = {
        uri: photoUri,
        name: fileName,
        type: 'image/jpeg',
      };
      
      formData.append('file', fileToUpload as any);
    } else {
      throw new Error('Photo URI is required');
    }
    
    // For file uploads, we'll use axios directly rather than the apiService
    // to properly handle FormData and content type
    const token = useAuthStore.getState().token;
    
    // Include challengeId as a query parameter if provided
    let url = `${API_URL}/challenges/submit/${userId}`;
    if (challengeId) {
      url += `?challengeId=${challengeId}`;
    }
    
    console.log(`[Challenge] Sending challenge to: ${url}`);
    
    try {
      console.log('[Challenge] Headers:', {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? 'Bearer token-exists' : 'No token'
      });
      
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      
      console.log('[Challenge] Challenge submission result:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Challenge] Error submitting challenge:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('[Challenge] Response status:', error.response.status);
        console.error('[Challenge] Response data:', error.response.data);
        console.error('[Challenge] Request config:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        });
      }
      throw error;
    }
  }

  /**
   * Get challenge history
   */
  async getChallengeHistory(): Promise<ChallengeHistoryDto> {
    const user = useAuthStore.getState().user;
    if (!user || !user.id) {
      throw new Error('User ID is required to get challenge history');
    }
    
    // Đảm bảo kiểu dữ liệu là string
    const userId = user.id.toString();
    
    console.log(`[Challenge] Getting history for user ${userId}, API URL: ${API_URL}`);
    try {
      const endpoint = `/challenges/history/${userId}`;
      console.log(`[Challenge] Calling endpoint: ${endpoint}`);
      
      const result = await apiService.get<ChallengeHistoryDto>(endpoint);
      console.log('[Challenge] Challenge history received');
      return result;
    } catch (error) {
      console.error('[Challenge] Error getting challenge history:', error);
      if (axios.isAxiosError(error)) {
        console.error('[Challenge] Response status:', error.response?.status);
        console.error('[Challenge] Response data:', error.response?.data);
      }
      throw error;
    }
  }

  /**
   * Get available challenge categories
   */
  async getChallengeCategories(): Promise<Record<string, string>> {
    console.log(`[Challenge] Getting challenge categories, API URL: ${API_URL}`);
    try {
      const result = await apiService.get<Record<string, string>>('/challenges/categories');
      console.log('[Challenge] Categories received');
      return result;
    } catch (error) {
      console.error('[Challenge] Error getting challenge categories:', error);
      if (axios.isAxiosError(error)) {
        console.error('[Challenge] Response status:', error.response?.status);
        console.error('[Challenge] Response data:', error.response?.data);
      }
      throw error;
    }
  }
}

export default new ChallengeService(); 
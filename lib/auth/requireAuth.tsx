import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth-store';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * A component that checks if the user is authenticated
 * and redirects to the welcome screen if not.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // If still loading auth state, show loading indicator
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }
  
  // If not authenticated, redirect to welcome screen
  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }
  
  // If authenticated, render children
  return <>{children}</>;
}

/**
 * A HOC that wraps a component with RequireAuth
 */
export function withRequireAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => (
    <RequireAuth>
      <Component {...props} />
    </RequireAuth>
  );
} 
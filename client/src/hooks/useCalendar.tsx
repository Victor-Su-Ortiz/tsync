// client/src/hooks/useCalendar.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';
import api from '../utils/api';

interface CalendarStatus {
  isConnected: boolean;
  syncEnabled: boolean;
  loading: boolean;
  error: string | null;
}

export const useCalendar = () => {
  const [status, setStatus] = useState<CalendarStatus>({
    isConnected: false,
    syncEnabled: false,
    loading: true,
    error: null,
  });
  const { authToken, isAuthenticated } = useAuth();
  const router = useRouter();

  const fetchCalendarStatus = useCallback(async () => {
    if (!isAuthenticated || !authToken) {
      setStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));
      const response = await api.get('/calendar/status', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      setStatus({
        isConnected: response.data.isConnected,
        syncEnabled: response.data.syncEnabled,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to fetch calendar status:', error);
      setStatus({
        isConnected: false,
        syncEnabled: false,
        loading: false,
        error: 'Failed to fetch calendar status'
      });
    }
  }, [authToken, isAuthenticated]);

  // Fetch status on mount and when auth changes
  useEffect(() => {
    fetchCalendarStatus();
  }, [fetchCalendarStatus]);

  const connectCalendar = useCallback((redirectPath?: string) => {
    // Use Expo Router's push method with searchParams for the redirect
    router.push({
      pathname: '/calendar-connection',
      params: { redirectPath: redirectPath || './(tabs)/home' }
    });
  }, [router]);

  const requireCalendarConnection = useCallback((redirectPath?: string) => {
    if (status.loading) return false;
    
    if (!status.isConnected) {
      Alert.alert(
        'Calendar Connection Required',
        'To use this feature, you need to connect your Google Calendar.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Connect Calendar', onPress: () => connectCalendar(redirectPath) }
        ]
      );
      return false;
    }
    
    return true;
  }, [status.isConnected, status.loading, connectCalendar]);

  const toggleCalendarSync = useCallback(async (enabled: boolean) => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      const response = await api.patch('/calendar/toggle-sync', 
        { enabled },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      setStatus(prev => ({
        ...prev,
        syncEnabled: response.data.syncEnabled,
        loading: false
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to toggle calendar sync:', error);
      setStatus(prev => ({ ...prev, loading: false }));
      Alert.alert('Error', 'Failed to update calendar sync settings');
      return false;
    }
  }, [authToken]);

  const disconnectCalendar = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      await api.delete('/calendar/disconnect', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      setStatus({
        isConnected: false,
        syncEnabled: false,
        loading: false,
        error: null
      });
      
      return true;
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
      setStatus(prev => ({ ...prev, loading: false }));
      Alert.alert('Error', 'Failed to disconnect Google Calendar');
      return false;
    }
  }, [authToken]);

  return {
    isCalendarConnected: status.isConnected,
    isCalendarSyncEnabled: status.syncEnabled,
    calendarLoading: status.loading,
    calendarError: status.error,
    fetchCalendarStatus,
    connectCalendar,
    requireCalendarConnection,
    toggleCalendarSync,
    disconnectCalendar
  };
};

export default useCalendar;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const CalendarConnectionScreen = () => {
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const { authToken } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirectPath = params.redirectPath as string || './(tabs)/home'; // Default to home route

  useEffect(() => {
    fetchGoogleAuthUrl();
  }, []);

  const fetchGoogleAuthUrl = async () => {
    try {
      setLoading(true);
      const response = await api.get('/calendar/auth-url', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setAuthUrl(response.data.authUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to get Google authorization URL');
      console.error('Failed to get auth URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = async (event: any) => {
    // Get the redirect URI from environment variables
    // Make sure this matches what's configured in Google Cloud Console
    const redirectUri = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI;
    
    if (event.url.includes(redirectUri) && event.url.includes('code=')) {
      setConnecting(true);
      
      // Extract the authorization code from the URL
      const code = event.url.split('code=')[1].split('&')[0];
      
      try {
        // Send the code to your backend
        await api.get(`/calendar/callback?code=${code}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        // Connection successful
        Alert.alert(
          'Success',
          'Google Calendar connected successfully!',
          [{ text: 'OK', onPress: () => router.push(redirectPath as RelativePathString) }]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to connect Google Calendar');
        console.error('Calendar connection error:', error);
      } finally {
        setConnecting(false);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-white h-full flex-1 justify-center items-center px-4">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="text-center mt-4 text-lg text-gray-600">Loading Google authorization...</Text>
      </SafeAreaView>
    );
  }

  if (connecting) {
    return (
      <SafeAreaView className="bg-white h-full flex-1 justify-center items-center px-4">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="text-center mt-4 text-lg text-gray-600">Connecting your calendar...</Text>
      </SafeAreaView>
    );
  }

  if (authUrl) {
    return (
      <WebView
        source={{ uri: authUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-white bg-opacity-80">
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      />
    );
  }

  return (
    <SafeAreaView className="bg-white h-full flex-1 justify-center items-center px-6">
      <View className="items-center w-full">
        <Image 
          source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" }}
          className="w-24 h-24 mb-8"
        />
        
        <Text className="text-3xl font-bold text-center mb-4">Connect Google Calendar</Text>
        
        <Text className="text-center text-base text-gray-600 mb-8">
          To use the meeting scheduling features in TSync, you need to connect your Google Calendar.
        </Text>
        
        <TouchableOpacity 
          onPress={fetchGoogleAuthUrl} 
          className="bg-blue-500 w-full rounded-full py-4 mb-4 shadow-md shadow-blue-300"
        >
          <View className="flex flex-row items-center justify-center">
            <Image
              source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" }}
              style={{ width: 24, height: 24, marginRight: 10 }}
            />
            <Text className="text-white font-semibold text-lg">Connect with Google</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push(redirectPath as RelativePathString)}
          className="bg-white w-full rounded-full py-4 border border-gray-300 shadow-sm"
        >
          <Text className="text-gray-600 font-medium text-center">Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CalendarConnectionScreen;
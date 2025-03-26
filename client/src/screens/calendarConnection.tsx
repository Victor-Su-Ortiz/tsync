import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Image, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams, RelativePathString } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { GOOGLE_WEB_ID } from '@env';

export default function CalendarConnectionScreen() {
  const [loading, setLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const { authToken } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const redirectPath = params.redirectPath as string || './(tabs)/home';

  useEffect(() => {
    fetchGoogleAuthUrl();
  }, []);

  const fetchGoogleAuthUrl = async () => {
    try {
      setLoading(true);
      const response = await api.get('/calendar/auth-url', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log("oauth:", response.data.authUrl)
      setAuthUrl(response.data.authUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to get Google authorization URL');
      console.error('Failed to get auth URL:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationStateChange = async (event: any) => {
    console.log("changing navigation")
    // Check if the URL is your callback URL with a code parameter
    const redirectUri = GOOGLE_WEB_ID;
    console.log(event.url)
    
    if (event.url.includes(redirectUri) && event.url.includes('code=')) {
      setConnecting(true);
      
      
      // Extract the authorization code from the URL
      const code = event.url.split('code=')[1].split('&')[0];
      console.log("code:",code)
      
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
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Loading Google authorization...</Text>
      </SafeAreaView>
    );
  }

  if (connecting) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>Connecting your calendar...</Text>
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
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Image 
          source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg' }}
          style={styles.calendarIcon}
        />
        
        <Text style={styles.title}>Connect Google Calendar</Text>
        
        <Text style={styles.infoText}>
          To use the meeting scheduling features, you need to connect your Google Calendar.
        </Text>
        
        <TouchableOpacity 
          onPress={fetchGoogleAuthUrl} 
          style={styles.connectButton}
        >
          <View style={styles.buttonContent}>
            <Image
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg' }}
              style={styles.googleIcon}
            />
            <Text style={styles.buttonText}>Connect with Google</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push(redirectPath as RelativePathString)}
          style={styles.skipButton}
        >
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight,
    backgroundColor: '#f9f9f9',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 249, 249, 0.8)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
    color: '#555',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  connectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 15,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '80%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
  },
  skipButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
});
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Alert,
  Text,
  ActivityIndicator,
  FlatList,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import axios from 'axios';
import { GOOGLE_PLACES_API, EXPO_PUBLIC_API_URL } from '@env';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext'; // Import the socket hook
import { api } from '@/src/utils/api';
import { NotificationType } from '@/src/utils/enums';

export type Notification = {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  type: NotificationType;
  updatedAt: string;
  timestamp: string;
  sender?: {
    id: string;
    name: string;
    profilePicture?: string | null;
  };
  requestId?: string; // Added to track the original request ID
};

type Place = {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  photos?: { photo_reference: string }[];
};

export default function Home() {
  const params = useLocalSearchParams();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const { notificationCount, updateNotificationCount } = useSocket();
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const { authToken } = useAuth();
  const appState = useRef(AppState.currentState);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Check for pending notifications when app resumes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        checkPendingNotifications();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Initial check for notifications
  useEffect(() => {
    if (authToken) {
      checkPendingNotifications();
    }
  }, [authToken]);

  // Function to check API for pending notifications
  const checkPendingNotifications = async () => {
    if (!authToken) return;

    try {
      console.log('Checking for pending notifications...');

      // Use the notifications endpoint to get unread count
      const response = await api.get('/notifications', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          unreadOnly: true,
        },
      });
      console.log('API Notifications:', response.data);

      if (response.data && response.data.pagination !== undefined) {
        const unreadCount = response.data.pagination.unreadCount;
        console.log('Unread notifications count:', unreadCount);

        updateNotificationCount(unreadCount);
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  // Detect when screen comes to focus
  useEffect(() => {
    // Check if we've actually navigated to this screen (not just initial render)
    if (prevPathRef.current !== pathname && pathname === '/') {
      console.log('Home screen came into focus, checking for notifications');
      checkPendingNotifications();
    }

    // Update the previous path ref
    prevPathRef.current = pathname;
  }, [pathname]);

  const handleTeaShopPress = async (teaShop: Place) => {
    return;
  };

  const handleNotificationPress = async () => {
    // Navigate to the notifications screen using the modal route

    try {
      const notificationIds = notifications.map(notification => notification._id);
      const response = await api.patch(
        'notifications/read',
        { notificationIds }, // This is the request body
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
    } catch (error: any) {
      console.log('ERROR WHILE MARKING NOTIFS AS READ:', error);
    } finally {
      router.push('./../(modal)/notifications');
    }
  };

  const GOOGLE_PLACES_API_KEY = GOOGLE_PLACES_API;

  const getUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Allow location access to find nearby stores!');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setLocation(location.coords);
    return location.coords;
  };

  const getNearbyStores = async (latitude: number, longitude: number) => {
    setLoading(true);
    const radius = 5000;
    const type = 'cafe';

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&keyword=tea&key=${GOOGLE_PLACES_API_KEY}`;

    try {
      const response = await axios.get(url);
      setShops(response.data.results);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (location) {
      getNearbyStores(location.latitude, location.longitude);
    }
  }, [location]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Tea Shops 🍵</Text>

        {/* Notification Icon */}
        <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
          <Ionicons name="notifications" size={24} color="#00cc99" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {/* Search Button */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => router.push('./../search/userSearch')}
      >
        <Ionicons name="search" size={20} color="#fff" />
        <Text style={styles.searchButtonText}>Search nearby users</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#00cc99" />
        </View>
      ) : (
        <FlatList
          data={shops as Place[]}
          keyExtractor={item => item.place_id}
          renderItem={({ item }) => {
            const photoRef = item.photos?.[0]?.photo_reference;
            const imageUrl = photoRef
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`
              : 'https://via.placeholder.com/400';

            return (
              <TouchableOpacity onPress={() => handleTeaShopPress(item)}>
                <ImageBackground
                  source={{ uri: imageUrl }}
                  style={styles.itemContainer}
                  imageStyle={styles.image}
                >
                  <View style={styles.overlay}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.address}>{item.vicinity}</Text>
                    <Text style={styles.rating}>Rating: ⭐ {item.rating || 'N/A'}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    position: 'relative',
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4B4B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00cc99',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  itemContainer: {
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 10,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  address: {
    color: '#ddd',
  },
  rating: {
    marginTop: 4,
    fontSize: 14,
    color: 'white',
  },
});

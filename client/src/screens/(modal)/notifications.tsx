import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { api } from '@/src/utils/api';
import UserProfile from '@/src/components/UserProfile';

// Define notification types
type NotificationType = 'promotion' | 'social' | 'friend_request';

// Ensure FriendStatus matches the UserProfile component
type FriendStatus = 'none' | 'pending' | 'friends' | 'incoming_request';

type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  userData?: {
    id: string;
    name: string;
    profilePicture?: string | null;
  };
  requestId?: string; // Added to track the original request ID
};

// Define User type to match the UserProfile component
type User = {
  id: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  friendStatus?: FriendStatus;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { authToken } = useAuth(); // Get auth token from context

  // State for User Profile modal
  const [userProfileVisible, setUserProfileVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>(undefined);

  // Keep track of friend statuses (across the app)
  const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendStatus>>({});

  // Fetch friend requests when component mounts
  useEffect(() => {
    fetchFriendRequests();
  }, []);

  const fetchFriendRequests = async () => {
    if (!authToken) return;

    setLoading(true);
    try {
      // Call your API endpoint to get pending friend requests
      const response = await api.get('/friends/requests', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Friend requests response:', response.data);

      // Check if we have valid data
      if (!response.data.requests || !Array.isArray(response.data.requests)) {
        console.error('Invalid response structure:', response.data);
        return;
      }

      // Transform friend requests into notification format
      const friendRequestNotifications = response.data.requests.map((request: any) => {
        // Log the request to debug the structure
        console.log('Processing request:', JSON.stringify(request));

        // Check if request.from exists
        if (!request.from) {
          console.warn('Missing from field in request:', request);
          return null;
        }

        return {
          id: `fr_${request._id}`, // Using _id instead of id based on your response
          title: 'Friend Request',
          message: `${request.from.name || 'Someone'} wants to be your friend`,
          timestamp: formatTimestamp(request.createdAt),
          read: false,
          type: 'friend_request' as NotificationType,
          userData: {
            id: request.from._id || request.from.id,
            name: request.from.name || 'User',
            profilePicture: request.from.profilePicture,
          },
          requestId: request._id // Save the original request ID
        };
      }).filter(Boolean); // Remove any null items

      // Combine with existing notifications
      setNotifications([...friendRequestNotifications]);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      // Continue with just sample notifications
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp from API date to relative time
  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Recently';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Show user profile from notification
  const showUserProfile = async (notification: Notification) => {
    if (!notification.userData) return;

    try {
      // Mark notification as read
      markAsRead(notification.id);

      // Set up the user object for the profile
      const user: User = {
        id: notification.userData.id,
        name: notification.userData.name,
        profilePicture: notification.userData.profilePicture || "",
        friendStatus: 'incoming_request' // This user sent a request to us
      };

      // Update the global friend status tracker
      setFriendStatuses(prev => ({
        ...prev,
        [user.id]: 'incoming_request'
      }));

      // Set selected user and request ID
      setSelectedUser(user);
      setSelectedRequestId(notification.requestId);
      setUserProfileVisible(true);
    } catch (error) {
      console.error('Error setting up user profile:', error);
      Alert.alert('Error', 'Failed to open user profile. Please try again.');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark the notification as read
    markAsRead(notification.id);

    // If it's a friend request, directly show the user profile
    if (notification.type === 'friend_request' && notification.userData) {
      showUserProfile(notification);
    }
  };

  const handleFriendStatusChange = (userId: string, newStatus: FriendStatus) => {
    console.log(`Notifications - Friend status changed for ${userId}: ${newStatus}`);

    // Update the global friend status tracker
    setFriendStatuses(prev => ({
      ...prev,
      [userId]: newStatus
    }));

    // If status changed to friends or none, remove the corresponding notification
    if (newStatus === 'friends' || newStatus === 'none') {
      setNotifications(prevNotifications =>
        prevNotifications.filter(notif =>
          !(notif.type === 'friend_request' && notif.userData?.id === userId)
        )
      );
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'promotion':
        return <Ionicons name="pricetag" size={24} color="#00cc99" />;
      case 'social':
        return <Ionicons name="people" size={24} color="#FF9500" />;
      case 'friend_request':
        return <Ionicons name="person-add" size={24} color="#007AFF" />;
      default:
        return <Ionicons name="notifications" size={24} color="#00cc99" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.dismiss()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#00cc99" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.emptySpace} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00cc99" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notificationItem, item.read ? styles.readNotification : styles.unreadNotification]}
              onPress={() => handleNotificationPress(item)}
            >
              <View style={styles.notificationIcon}>
                {getIconForType(item.type)}
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
                <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
              </View>
              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No notifications yet</Text>
            </View>
          }
        />
      )}

      {/* User Profile Modal */}
      <UserProfile
        visible={userProfileVisible}
        onClose={() => {
          setUserProfileVisible(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onFriendStatusChange={handleFriendStatusChange}
        // fromNotification={true}
        requestId={selectedRequestId}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
    width: 30, // Give it a fixed width
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center', // Center the title within this container
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySpace: {
    width: 30, // Match the width of backButton for balance
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
  },
  readNotification: {
    backgroundColor: 'white',
  },
  notificationIcon: {
    marginRight: 16,
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00cc99',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
});
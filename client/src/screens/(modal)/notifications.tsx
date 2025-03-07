import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { api } from '@/src/utils/api';


// Define notification types
type NotificationType = 'promotion' | 'social' | 'friend_request';

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
  };
};


export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { authToken } = useAuth(); // Get auth token from context

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
            name: request.from.name || 'User'
          }
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

  const handleNotificationPress = async (notification: Notification) => {
    // Mark the notification as read
    markAsRead(notification.id);

    // If it's a friend request, handle differently
    if (notification.type === 'friend_request' && notification.userData) {
      // You could navigate to user profile or show an action sheet
      Alert.alert(
        'Friend Request',
        `${notification.userData.name} wants to be your friend`,
        [
          {
            text: 'View Profile',
            onPress: () => {
              // Navigate to user profile
              // You'll need to implement this navigation
              console.log('Navigate to profile for user:', notification.userData?.id);
            }
          },
          {
            text: 'Accept',
            onPress: () => acceptFriendRequest(notification)
          },
          {
            text: 'Decline',
            style: 'destructive',
            onPress: () => declineFriendRequest(notification)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const acceptFriendRequest = async (notification: Notification) => {
    if (!notification.userData || !authToken) return;

    try {
      // Extract the actual request ID from the notification ID
      const requestId = notification.id.replace('fr_', '');

      // Call your API to accept the friend request
      await api.post(`/friends/requests/${requestId}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Remove this notification from the list
      setNotifications(notifications.filter(n => n.id !== notification.id));

      // Show success message
      Alert.alert('Success', `You are now friends with ${notification.userData.name}`);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    }
  };

  const declineFriendRequest = async (notification: Notification) => {
    if (!notification.userData || !authToken) return;

    try {
      // Extract the actual request ID from the notification ID
      const requestId = notification.id.replace('fr_', '');

      // Call your API to decline the friend request
      await api.post(`/friends/requests/${requestId}/reject`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Remove this notification from the list
      setNotifications(notifications.filter(n => n.id !== notification.id));

      // Show success message
      Alert.alert('Friend Request Declined', `Friend request from ${notification.userData.name} has been declined`);
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request. Please try again.');
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.clearAllButton}>
          <Text style={styles.clearAllText}>Clear</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
    width: 60, // Give it a fixed width
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center', // Center the text
  },
  clearAllButton: {
    padding: 5,
    width: 60, // Give it a fixed width to balance with back button
  },
  clearAllText: {
    color: '#00cc99',
    fontWeight: '500',
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
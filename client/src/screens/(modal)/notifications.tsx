import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, router } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext'; // Import the socket hook
import { api } from '@/src/utils/api';
import { User } from '../search/userSearch';
import { FriendRequestStatus, FriendStatus, NotificationType } from '@/src/utils/enums';
import { Notification } from '../(tabs)/home';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { authToken } = useAuth(); // Get auth token from context
  const { resetNotificationCount } = useSocket(); // Get reset function from socket context

  // Fetch friend requests when component mounts and reset notification count
  useEffect(() => {
    fetchNotifications();

    // Reset notification count when the notifications screen is opened
    resetNotificationCount();
  }, []);

  // Do not call friend reqs api and call notifs
  const fetchNotifications = async () => {
    if (!authToken) return;

    setLoading(true);
    try {
      // Call your API endpoint to get pending friend requests
      const response = await api.get('/notifications', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      let notifications = response.data.notifications;

      notifications.forEach((notification: any) => ({
        ...notification,
        timestamp: formatTimestamp(notification.updatedAt),
      }));
      setNotifications([...notifications]);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
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
      notifications.map(notif => (notif._id === id ? { ...notif, read: true } : notif)),
    );
  };

  // Show user profile from notification
  const showUserProfile = async (notification: any) => {
    if (!notification.sender) return;

    try {
      // Mark notification as read
      markAsRead(notification._id);

      let friendStatus = FriendStatus.NONE;
      if (notification.relatedId?.status === FriendRequestStatus.PENDING) {
        friendStatus = FriendStatus.INCOMING_REQUEST;
      } else if (notification.relatedId?.status === FriendRequestStatus.ACCEPTED) {
        friendStatus = FriendStatus.FRIENDS;
      }

      // Set up the user object for the profile
      const user: User = {
        id: notification.sender._id,
        name: notification.sender.name,
        profilePicture: notification.sender.profilePicture || '',
        friendStatus,
      };

      // Set selected user and request ID
      router.push({
        pathname: './../profile/userProfile',
        params: {
          userData: JSON.stringify(user),
        },
      });
    } catch (error) {
      console.error('Error setting up user profile:', error);
      Alert.alert('Error', 'Failed to open user profile. Please try again.');
    }
  };

  const showEvent = async (notification: any) => {
    // if (!notification.eventId) return;

    try {
      // Mark notification as read
      markAsRead(notification._id);
      router.push(`/(eventDetails)/${notification.relatedId._id}` as RelativePathString);
    } catch (error) {
      console.error('Error setting up event details:', error);
      Alert.alert('Error', 'Failed to open event details. Please try again.');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark the notification as read
    markAsRead(notification._id);
    console.log(notification);

    // If it's a friend request, directly show the user profile
    if (
      (notification.type === NotificationType.FRIEND_REQUEST ||
        notification.type === NotificationType.FRIEND_ACCEPTED) &&
      notification.sender
    ) {
      showUserProfile(notification);
      console.log('NOTIFICATION TYPE', notification.type);
    } else if (notification.type === NotificationType.MEETING_INVITE) {
      showEvent(notification);
      console.log('NOTIFICATION TYPE', notification.type);
      console.log('NOTIFCIATON', notification);
    } else {
      console.log('DID NOT SHOW USER PROIFLE, NOTIFICATION TYPE', notification.type);
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'MEETING_INVITE':
        return <Ionicons name="calendar" size={24} color="#00cc99" />;
      case 'FRIEND_ACCEPTED':
        return <Ionicons name="people" size={24} color="#FF9500" />;
      case 'FRIEND_REQUEST':
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
          keyExtractor={(item, index) => item._id || `notification_${index}_${Date.now()}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.notificationItem,
                item.read ? styles.readNotification : styles.unreadNotification,
              ]}
              onPress={() => handleNotificationPress(item)}
            >
              <View style={styles.notificationIcon}>{getIconForType(item.type)}</View>
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

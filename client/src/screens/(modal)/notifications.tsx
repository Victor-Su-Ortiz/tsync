import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext';
import { api } from '@/src/utils/api';
import UserProfile from '@/src/components/UserProfile';

// Notification type enumeration
type NotificationType = 'friend_request' | 'friend_accepted';

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
  requestId?: string;
  _id?: string; // Backend ID for API calls
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
  const { authToken, userInfo } = useAuth();
  const { updateNotificationCount } = useSocket();

  // State for User Profile modal
  const [userProfileVisible, setUserProfileVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>(undefined);

  // Keep track of friend statuses
  const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendStatus>>({});

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchAllNotifications();
  }, []);

  const fetchAllNotifications = async () => {
    setLoading(true);

    try {
      // First try to get notifications from your main notification API
      const notificationsResponse = await fetchNotificationsFromAPI();

      // Then get pending friend requests
      const friendRequestsResponse = await fetchFriendRequests();

      // Combine both types of notifications and sort by timestamp (newest first)
      const allNotifications = [
        ...(notificationsResponse || []),
        ...(friendRequestsResponse || [])
      ].sort((a, b) => {
        // Extract timestamps and compare
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA; // Newest first
      });

      setNotifications(allNotifications);

      // Update notification count based on unread count
      const unreadCount = allNotifications.filter(notif => !notif.read).length;
      updateNotificationCount(unreadCount);
    } catch (error) {
      console.error('Error fetching all notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationsFromAPI = async (): Promise<Notification[]> => {
    if (!authToken) return [];

    try {
      // Try the notifications API endpoint first
      const response = await api.get('/notifications', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Notifications API response:', response.data);

      if (!response.data.notifications || !Array.isArray(response.data.notifications)) {
        console.log('No notifications found or invalid format');
        return [];
      }

      // Map API notifications to our format
      return response.data.notifications.map((notif: any) => {
        // Determine notification type
        let type: NotificationType = 'friend_request';

        if (notif.type === 'FRIEND_ACCEPTED') {
          type = 'friend_accepted';
        }

        return {
          id: notif._id,
          _id: notif._id,
          title: type === 'friend_accepted' ? 'Friend Request Accepted' : 'Friend Request',
          message: notif.message,
          timestamp: formatTimestamp(notif.createdAt),
          read: notif.read,
          type,
          userData: notif.sender ? {
            id: notif.sender._id || notif.sender.id,
            name: notif.sender.name,
            profilePicture: notif.sender.profilePicture,
          } : undefined,
          requestId: notif.relatedId?._id || notif.relatedId
        };
      });
    } catch (error) {
      console.error('Error fetching notifications from API:', error);
      return [];
    }
  };

  const fetchFriendRequests = async (): Promise<Notification[]> => {
    if (!authToken) return [];

    try {
      // Get pending friend requests
      const response = await api.get('/friends/requests/received/pending', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Friend requests response:', response.data);

      // Check if we have valid data
      if (!response.data.requests || !Array.isArray(response.data.requests)) {
        console.log('No friend requests found or invalid format');
        return [];
      }

      // Transform friend requests into notification format
      return response.data.requests
        .map((request: any) => {
          if (!request.sender) {
            console.warn('Missing sender field in request:', request);
            return null;
          }

          return {
            id: `fr_${request._id}`,
            _id: request._id,
            title: 'Friend Request',
            message: `${request.sender.name || 'Someone'} wants to be your friend`,
            timestamp: formatTimestamp(request.createdAt),
            read: false, // Always keep friend requests as unread until action is taken
            type: 'friend_request' as NotificationType,
            userData: {
              id: request.sender._id || request.sender.id,
              name: request.sender.name || 'User',
              profilePicture: request.sender.profilePicture,
            },
            requestId: request._id
          };
        })
        .filter(Boolean); // Remove any null values
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return [];
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

  // Show user profile from notification WITHOUT marking it as read
  const showUserProfile = (notification: Notification) => {
    if (!notification.userData) return;

    try {
      // Set up the user object for the profile
      const user: User = {
        id: notification.userData.id,
        name: notification.userData.name,
        profilePicture: notification.userData.profilePicture || "",
        friendStatus: notification.type === 'friend_request' ? 'incoming_request' : 'friends'
      };

      // Update the global friend status tracker (Fixed version)
      setFriendStatuses((prev) => {
        const newStatuses = { ...prev };
        newStatuses[user.id] = user.friendStatus ? user.friendStatus : "none";
        return newStatuses;
      });

      // Set selected user and request ID
      setSelectedUser(user);
      setSelectedRequestId(notification.requestId);
      setUserProfileVisible(true);
    } catch (error) {
      console.error('Error setting up user profile:', error);
      Alert.alert('Error', 'Failed to open user profile. Please try again.');
    }
  };

  // Also fix the handleFriendStatusChange function:
  const handleFriendStatusChange = (userId: string, newStatus: FriendStatus, requestId?: string) => {
    console.log(`Notifications - Friend status changed for ${userId}: ${newStatus}`);

    // Update the global friend status tracker (Fixed version)
    setFriendStatuses((prev) => {
      const newStatuses = { ...prev };
      newStatuses[userId] = newStatus;
      return newStatuses;
    });

    // When action is taken (accept/reject), remove the notification
    if (newStatus === 'friends' || newStatus === 'none') {
      setNotifications(prevNotifications => {
        const updatedNotifications = prevNotifications.filter(
          notif => !(notif.type === 'friend_request' && notif.userData?.id === userId)
        );

        // Update notification count based on remaining unread notifications
        const remainingUnread = updatedNotifications.filter(notif => !notif.read).length;
        updateNotificationCount(remainingUnread);

        return updatedNotifications;
      });
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Only friend acceptance notifications are marked as read when clicked
    if (notification.type === 'friend_accepted' && !notification.read) {
      markAsRead(notification);
    }

    // For all notifications, show the user profile
    showUserProfile(notification);
  };

  // Make API call to mark notification as read and update notification count
  const markAsRead = (notification: Notification) => {
    if (!authToken || notification.read) return;

    // Update UI optimistically
    setNotifications(prevNotifications =>
      prevNotifications.map(notif =>
        notif.id === notification.id ? { ...notif, read: true } : notif
      )
    );

    // Count remaining unread notifications
    const remainingUnread = notifications.filter(
      notif => notif.id !== notification.id && !notif.read
    ).length;

    // Update notification count
    updateNotificationCount(remainingUnread);

    // If this is from the notifications API, mark it as read
    if (notification._id && !notification.id.startsWith('fr_')) {
      api.patch('/notifications/read',
        { notificationIds: [notification._id] },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      ).catch(error => {
        console.error('Error marking notification as read:', error);
      });
    }
  };

  // Get the appropriate icon for each notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'friend_request':
        return <Ionicons name="person-add" size={24} color="#007AFF" />;
      case 'friend_accepted':
        return <Ionicons name="people" size={24} color="#00cc99" />;
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
                {getNotificationIcon(item.type)}
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
      {selectedUser && (
        <UserProfile
          visible={userProfileVisible}
          onClose={() => {
            setUserProfileVisible(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onFriendStatusChange={handleFriendStatusChange}
          requestId={selectedRequestId}
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
    width: 30,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySpace: {
    width: 30,
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
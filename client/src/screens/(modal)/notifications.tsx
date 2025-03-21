import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useSocket } from '@/src/context/SocketContext'; // Import the socket hook
import { api } from '@/src/utils/api';
import UserProfile from '@/src/components/UserProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/src/components/UserProfile';
import { FriendStatus, NotificationType } from '@/src/utils/enums';
import { Notification } from '../(tabs)/home';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { authToken } = useAuth(); // Get auth token from context
  const { resetNotificationCount } = useSocket(); // Get reset function from socket context
  // State for User Profile modal
  const [userProfileVisible, setUserProfileVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | undefined>(undefined);

  // Keep track of friend statuses (across the app)
  const [friendStatuses, setFriendStatuses] = useState<Record<string, FriendStatus>>({});


  // Fetch friend requests when component mounts and reset notification count
  useEffect(() => {
    fetchFriendRequests();

    // Reset notification count when the notifications screen is opened
    resetNotificationCount();

    // Also clear the stored count in AsyncStorage
    const clearStoredCount = async () => {
      try {
        await AsyncStorage.setItem('notificationCount', '0');
        console.log('Cleared notification count in AsyncStorage');
      } catch (error) {
        console.error('Error clearing notification count:', error);
      }
    };

    clearStoredCount();

    // Debug: Log that we're resetting notifications
    console.log('Notifications screen opened, resetting notification count');
  }, []);


  // Do not call friend reqs api and call notifs
  const fetchFriendRequests = async () => {
    if (!authToken) return;

    setLoading(true);
    try {
      // Call your API endpoint to get pending friend requests
      const response = await api.get('/notifications', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      let pendingFriendRequests = response.data.notifications.filter((notification: Notification) => { return notification.type == "FRIEND_REQUEST" })
      pendingFriendRequests = pendingFriendRequests.map((notification: Notification) => ({ ...notification, title: "Friend Request" }))
      pendingFriendRequests = pendingFriendRequests.map((notification: Notification) => ({ ...notification, timestamp: formatTimestamp(notification.updatedAt) }))
      console.log("Pending friend requests", pendingFriendRequests);
      setNotifications([...pendingFriendRequests]);
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
      notifications.map(notif =>
        notif._id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Show user profile from notification
  const showUserProfile = async (notification: Notification) => {
    if (!notification.userData) return;

    try {
      // Mark notification as read
      markAsRead(notification._id);

      // Set up the user object for the profile
      const user: User = {
        id: notification.userData.id,
        name: notification.userData.name,
        profilePicture: notification.userData.profilePicture || "",
        friendStatus: FriendStatus.INCOMING_REQUEST // This user sent a request to us
      };

      // Update the global friend status tracker
      setFriendStatuses(prev => ({
        ...prev,
        [user.id]: FriendStatus.INCOMING_REQUEST
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
    markAsRead(notification._id);

    // If it's a friend request, directly show the user profile
    if (notification.type === NotificationType.FRIEND_REQUEST && notification.userData) {
      showUserProfile(notification);
    } else {
      console.log("NOTIFICATION TYPE", notification.type);
    }
  };

  const handleFriendStatusChange = (userId: string, newStatus: FriendStatus, requestId?: string, actionTaken: boolean = false) => {
    console.log(`Notifications - Friend status changed for ${userId}: ${newStatus}`);

    // Update the global friend status tracker
    setFriendStatuses(prev => ({
      ...prev,
      [userId]: newStatus
    }));


    // From Claude: Good to know
    // In UserProfile component when accept/reject is clicked
    // onFriendStatusChange(userId, newStatus, true); // true indicates action was taken

    // Only remove notifications when an explicit action was taken
    if (actionTaken && (newStatus === 'friends' || newStatus === 'none')) {
      setNotifications(prevNotifications =>
        prevNotifications.filter(notif =>
          !(notif.type === NotificationType.FRIEND_REQUEST && notif.userData?.id === userId)
        )
      );
    }
  };



  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'PROMOTION':
        return <Ionicons name="pricetag" size={24} color="#00cc99" />;
      case 'SOCIAL':
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
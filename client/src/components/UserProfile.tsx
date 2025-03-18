// components/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// Define all possible friend statuses
type FriendStatus = 'none' | 'pending' | 'friends' | 'incoming_request';

type User = {
  id: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  friendStatus?: FriendStatus;
};

type UserProfileProps = {
  visible: boolean;
  onClose: () => void;
  user: User;
  onFriendStatusChange?: (userId: string, newStatus: FriendStatus, requestId?: string) => void;
  requestId?: string;
  requestStatus?: string;
};

const UserProfile = ({
  visible,
  onClose,
  user,
  onFriendStatusChange,
  requestId,
  requestStatus
}: UserProfileProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  // Add local state to track friend status
  const [currentStatus, setCurrentStatus] = useState<FriendStatus>('none');

  const { authToken } = useAuth();

  // Logging for debugging component props
  useEffect(() => {
    if (visible) {
      console.log('UserProfile rendered with:', {
        userId: user?.id,
        userFriendStatus: user?.friendStatus,
        requestStatus,
        currentStatus,
        requestId
      });
    }
  }, [visible, user, requestStatus, currentStatus, requestId]);

  // Set initial status from props when component mounts or props change
  useEffect(() => {
    // First check requestStatus (direct prop)
    if (requestStatus) {
      setCurrentStatus(requestStatus as FriendStatus);
    }
    // Then check user.friendStatus if requestStatus is not provided
    else if (user.friendStatus) {
      setCurrentStatus(user.friendStatus);
    }
  }, [requestStatus, user.friendStatus]);

  const handleSendFriendRequest = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Send friend request using our API route
      const request = await api.post(`/friends/requests/${user.id}`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Update local status
      setCurrentStatus('pending');

      // Notify parent component
      if (onFriendStatusChange) {
        onFriendStatusChange(user.id, 'pending', request.data.friendRequest._id);
      }

      // Show success message
      Alert.alert("Friend Request Sent", `Your friend request to ${user.name} has been sent.`);
    } catch (error: any) {
      console.error("Error sending friend request:", error.response?.data || error);

      // Show a more specific error message based on the error response
      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "Failed to send friend request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!user || !requestId) return;
    setIsLoading(true);

    try {
      // You'll need to implement a cancel request endpoint on your backend
      await api.delete(`/friends/requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Update local status
      setCurrentStatus('none');

      // Notify parent component
      if (onFriendStatusChange) {
        onFriendStatusChange(user.id, 'none', requestId);
      }

      Alert.alert("Request Cancelled", "Friend request has been cancelled.");
    } catch (error: any) {
      console.error("Error cancelling request:", error);
      Alert.alert("Error", "Failed to cancel request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!user || !requestId) return;
    setIsLoading(true);

    try {
      // Accept friend request using our API route
      await api.put(`/friends/requests/${requestId}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Update local status
      setCurrentStatus('friends');

      // Notify parent component
      if (onFriendStatusChange) {
        onFriendStatusChange(user.id, 'friends', requestId);
      }

      // Show success message
      Alert.alert("Friend Request Accepted", `You are now friends with ${user.name}.`);

      // Close the profile after accepting
      setTimeout(() => onClose(), 1500);
    } catch (error: any) {
      console.error("Error accepting friend request:", error);

      // Show a more specific error message
      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "Failed to accept friend request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineFriendRequest = async () => {
    if (!user || !requestId) return;

    setIsLoading(true);

    try {
      // Reject friend request using our API route
      await api.put(`/friends/requests/${requestId}/reject`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Update local status
      setCurrentStatus('none');

      // Notify parent component
      if (onFriendStatusChange) {
        onFriendStatusChange(user.id, 'none', requestId);
      }

      // Show success message
      Alert.alert("Friend Request Declined", `Friend request from ${user.name} has been declined.`);

      // Close the profile after declining
      setTimeout(() => onClose(), 1500);
    } catch (error: any) {
      console.error("Error declining friend request:", error);

      // Show a more specific error message
      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "Failed to decline friend request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      presentationStyle='fullScreen'
    >
      <View style={styles.modalContainer}>
        <View style={styles.container}>
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onClose}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{user.name}</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <Image
                source={{ uri: user.profilePicture || "https://via.placeholder.com/150" }}
                style={styles.profileImage}
              />
              <Text style={styles.userName}>{user.name}</Text>
            </View>

            {/* Friend Request Button */}
            <View style={styles.actionButtonContainer}>
              {loadingStatus ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#00cc99" />
                  <Text style={styles.loadingText}>Checking status...</Text>
                </View>
              ) : currentStatus === 'incoming_request' ? (
                <View style={styles.requestButtonsContainer}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={handleAcceptFriendRequest}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Accept</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={handleDeclineFriendRequest}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="close" size={20} color="#fff" />
                        <Text style={styles.buttonText}>Decline</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : currentStatus === 'none' ? (
                <TouchableOpacity
                  style={styles.friendRequestButton}
                  onPress={handleSendFriendRequest}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="person-add" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Send Friend Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : currentStatus === 'pending' ? (
                <TouchableOpacity
                  style={[styles.friendRequestButton, styles.pendingButton]}
                  onPress={handleCancelFriendRequest}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="time" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Cancel Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={[styles.friendRequestButton, styles.friendsButton]}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Friends</Text>
                </View>
              )}
            </View>

            {/* User Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>42</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Hosted</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>23</Text>
                <Text style={styles.statLabel}>Attended</Text>
              </View>
            </View>

            {/* Profile Information */}
            <View style={styles.infoContainer}>
              <View style={styles.bioContainer}>
                <Text style={styles.bioLabel}>About</Text>
                <Text style={styles.bioText}>
                  {user.bio || "This user hasn't added a bio yet."}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 60, // Show part of the search screen behind
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#00cc99',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00cc99',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
  },
  actionButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  requestButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  friendRequestButton: {
    backgroundColor: '#00cc99',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
  },
  acceptButton: {
    backgroundColor: '#00cc99',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
    flex: 1,
    marginRight: 8,
  },
  declineButton: {
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
    flex: 1,
    marginLeft: 8,
  },
  pendingButton: {
    backgroundColor: '#f5a623',
  },
  friendsButton: {
    backgroundColor: '#4a90e2',
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  infoContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  bioContainer: {
    marginTop: 8,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  }
});

export default UserProfile;
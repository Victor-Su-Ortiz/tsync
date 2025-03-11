// components/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Modal,
  Platform,
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
  user: User | null;
  onFriendStatusChange?: (userId: string, newStatus: FriendStatus) => void;
  fromNotification?: boolean;
  requestId?: string;
};

const UserProfile = ({
  visible,
  onClose,
  user,
  onFriendStatusChange,
  // fromNotification = false,
  requestId
}: UserProfileProps) => {
  const [friendRequestStatus, setFriendRequestStatus] = useState<FriendStatus>('none');
  const [isLoading, setIsLoading] = useState(false);

  const { authToken } = useAuth();

  // Update friend status when user changes or component mounts
  useEffect(() => {
    console.log(requestId);
    if (user) {
      console.log('User profile loaded:', user.name, 'with status:', user.friendStatus);

      // First, check if we need to fetch the current status
      // This is useful after sign out/sign in when local state is lost
      async function verifyFriendRequestStatus() {
        try {
          // Check if we've sent a request to this user
          const outgoingResponse = await api.get('/friends/requests/', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (outgoingResponse.data.requests && Array.isArray(outgoingResponse.data.requests)) {
            const sentRequestToUser = outgoingResponse.data.requests.some((req: any) => {
              const toId = req.to?._id || req.to?.id;
              return toId === user.id;
            });

            if (sentRequestToUser) {
              console.log(`Detected outgoing request to ${user.name}`);
              setFriendRequestStatus('pending');
              if (onFriendStatusChange) {
                onFriendStatusChange(user.id, 'pending');
              }
              return;
            }
          }

          // // Check if we've received a request from this user
          // const incomingResponse = await api.get('/friends/requests', {
          //   headers: {
          //     'Authorization': `Bearer ${authToken}`
          //   }
          // });

          // if (incomingResponse.data.requests && Array.isArray(incomingResponse.data.requests)) {
          //   const receivedRequestFromUser = incomingResponse.data.requests.some((req: any) => {
          //     const fromId = req.from?._id || req.from?.id;
          //     return fromId === user.id;
          //   });

          //   if (receivedRequestFromUser) {
          //     console.log(`Detected incoming request from ${user.name}`);
          //     setFriendRequestStatus('incoming_request');
          //     if (onFriendStatusChange) {
          //       onFriendStatusChange(user.id, 'incoming_request');
          //     }
          //     return;
          //   }
          // }

          // If we reach here, set status based on props
          determineStatus();

        } catch (error) {
          console.error("Error verifying friend request status:", error);
          // Fall back to regular status determination
          determineStatus();
        }
      }

      // Helper function to determine status based on props
      const determineStatus = () => {
        // Logic for determining the correct status to show:
        // 1. If opened from notification, always show incoming_request
        // 2. If user.friendStatus is incoming_request or pending, respect that
        // 3. Otherwise use whatever status is provided
        // if (fromNotification) {
        //   setFriendRequestStatus('incoming_request');
        //   console.log(`Setting ${user.name}'s status to incoming_request (from notification)`);
        if (user.friendStatus === 'incoming_request') {
          setFriendRequestStatus('incoming_request');
          console.log(`Setting ${user.name}'s status to incoming_request (from props)`);
        } else if (user.friendStatus === 'pending') {
          setFriendRequestStatus('pending');
          console.log(`Setting ${user.name}'s status to pending (from props)`);
        } else {
          setFriendRequestStatus(user.friendStatus || 'none');
          console.log(`Setting ${user.name}'s status to ${user.friendStatus || 'none'} (from props)`);
        }
      };

      // Verify current status with API
      verifyFriendRequestStatus();
    }
  }, [user, onFriendStatusChange, authToken]);

  // This function updates both the local state and calls the parent callback
  const updateFriendStatus = (userId: string, newStatus: FriendStatus) => {
    setFriendRequestStatus(newStatus);
    if (onFriendStatusChange) {
      onFriendStatusChange(userId, newStatus);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Make API call to send a friend request
      const response = await api.post(`/friends/requests/${user.id}`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Update the friend status to pending
      updateFriendStatus(user.id, 'pending');

      // Show success message
      Alert.alert("Friend Request Sent", `Your friend request to ${user.name} has been sent.`);
    } catch (error: any) {
      console.error("Error sending friend request:", error.response?.data || error);
      Alert.alert("Error", "Failed to send friend request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // First, find the outgoing request ID
      let requestIdToCancel;

      // Fetch all outgoing requests to find the right one
      const outgoingResponse = await api.get('/friends/requests/sent', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (outgoingResponse.data.requests && Array.isArray(outgoingResponse.data.requests)) {
        const sentRequest = outgoingResponse.data.requests.find((req: any) => {
          const toId = req.to?._id || req.to?.id;
          return toId === user.id;
        });

        if (sentRequest) {
          requestIdToCancel = sentRequest._id;
          console.log(`Found outgoing request ID to cancel: ${requestIdToCancel}`);
        }
      }

      if (!requestIdToCancel) {
        throw new Error("Could not find the friend request to cancel");
      }

      // Cancel the friend request
      await api.delete(`/friends/requests/${requestIdToCancel}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Update the friend status to none
      updateFriendStatus(user.id, 'none');

      // Show success message
      Alert.alert("Request Cancelled", `Your friend request to ${user.name} has been cancelled.`);
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      Alert.alert("Error", "Failed to cancel friend request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!user) return;

    // If we don't have a specific requestId, we need to fetch it
    let actualRequestId = requestId;

    setIsLoading(true);

    try {
      // If we don't have a requestId, fetch pending requests to find it
      if (!actualRequestId) {
        console.log("No request ID provided, fetching from API...");
        const response = await api.put(`/friends/requests/${actualRequestId}/accept`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        console.log("Friend requests response:", response.data);

        // Find the request from this user
        if (response.data.requests && Array.isArray(response.data.requests)) {
          const matchingRequest = response.data.requests.find((req: any) => {
            const fromId = req.from?._id || req.from?.id;
            return fromId === user.id;
          });

          if (matchingRequest) {
            actualRequestId = matchingRequest._id;
            console.log(`Found request ID: ${actualRequestId}`);
          }
        }
      }

      if (!actualRequestId) {
        throw new Error("Could not find the friend request ID");
      }

      // Call API to accept the friend request
      await api.put(`/friends/requests/${actualRequestId}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Update the friend status to friends
      updateFriendStatus(user.id, 'friends');

      // Show success message
      Alert.alert("Friend Request Accepted", `You are now friends with ${user.name}.`);

      // Close the profile after accepting
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      Alert.alert("Error", "Failed to accept friend request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineFriendRequest = async () => {
    if (!user) return;

    // If we don't have a specific requestId, we need to fetch it
    let actualRequestId = requestId;

    setIsLoading(true);

    try {
      // If we don't have a requestId, fetch pending requests to find it
      if (!actualRequestId) {
        console.log("No request ID provided, fetching from API...");
        const response = await api.get('/friends/requests', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        console.log("Friend requests response:", response.data);

        // Find the request from this user
        if (response.data.requests && Array.isArray(response.data.requests)) {
          const matchingRequest = response.data.requests.find((req: any) => {
            const fromId = req.from?._id || req.from?.id;
            return fromId === user.id;
          });

          if (matchingRequest) {
            actualRequestId = matchingRequest._id;
            console.log(`Found request ID: ${actualRequestId}`);
          }
        }
      }

      if (!actualRequestId) {
        throw new Error("Could not find the friend request ID");
      }

      // Call API to decline the friend request
      await api.post(`/friends/requests/${actualRequestId}/reject`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      // Update the friend status to none
      updateFriendStatus(user.id, 'none');

      // Show success message
      Alert.alert("Friend Request Declined", `Friend request from ${user.name} has been declined.`);

      // Close the profile after declining
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("Error declining friend request:", error);
      Alert.alert("Error", "Failed to decline friend request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Debug log for friend status
  useEffect(() => {
    if (user) {
      console.log(`Current friend status for ${user.name}: ${friendRequestStatus}`);
    }
  }, [friendRequestStatus, user]);

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
            <Text style={styles.headerTitle}>Profile</Text>
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
              {friendRequestStatus === 'incoming_request' ? (
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
              ) : friendRequestStatus === 'none' ? (
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
              ) : friendRequestStatus === 'pending' ? (
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
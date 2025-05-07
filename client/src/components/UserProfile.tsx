import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { FriendStatus } from '@/src/utils/enums';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import images from '@/src/constants/images';
import { useFriends } from '../context/FriendRequestContext';

export type UserProfileProps = {
  userData: {
    id: string;
    name: string;
    profilePicture?: string;
    friendStatus?: FriendStatus;
    requestId?: string;
  };
  isCurrentUser?: boolean;
  showHeader?: boolean;
  onBackPress?: () => void;
};

const UserProfile = ({
  userData,
  isCurrentUser = false,
  showHeader = true,
  onBackPress,
}: UserProfileProps) => {
  const { authToken, logout } = useAuth();
  const {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    refreshFriendData,
    friends,
    receivedRequests,
    sentRequests,
    loading,
    getFriendStatus,
  } = useFriends();

  const router = useRouter();
  const [user, setUser] = useState(userData);
  const [isLoading, setIsLoading] = useState(false);
  const { status: currentStatus, requestId } = getFriendStatus(user.id);

  const handleSignOut = async () => {
    try {
      // Sign out from Google
      await GoogleSignin.signOut();

      // Clear local auth state
      await logout();

      // Navigate to login screen
      router.replace('./../');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !user.id) return;

    setIsLoading(true);

    try {
      await sendFriendRequest(user.id);
      // No need to manually set status as it will be updated in the effect hook
      Alert.alert('Friend Request Sent', `Your friend request to ${user.name} has been sent.`);
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to send friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    // Safety check: make sure sentRequests is defined and not empty
    if (!sentRequests || sentRequests.length === 0) {
      console.error('No sent requests available');
      return;
    }

    // Find the request safely with null checks
    const req = sentRequests.find(req => req && req.receiver && req.receiver._id === user.id);

    // Safety check: make sure the request exists
    if (!req || !req._id) {
      console.error('No valid request found to cancel');

      // Try to find the request again after refreshing
      const refreshedReq = sentRequests.find(
        req => req && req.receiver && req.receiver._id === user.id,
      );

      if (!refreshedReq || !refreshedReq._id) {
        Alert.alert('Error', 'Could not find the friend request to cancel. Please try again.');
        return;
      }
    }

    const reqId = req?._id;

    if (reqId == undefined) {
      return;
    }
    setIsLoading(true);

    try {
      await cancelFriendRequest(reqId);
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      Alert.alert('Error', 'Failed to cancel request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!requestId) {
      console.error('No request ID found to accept');
      return;
    }

    setIsLoading(true);

    try {
      await acceptFriendRequest(requestId);

      Alert.alert('Friend Request Accepted', `You are now friends with ${user.name}.`);
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (!requestId) {
      console.error('No request ID found to accept');
      return;
    }

    setIsLoading(true);

    try {
      await rejectFriendRequest(requestId);
      Alert.alert('Friend Request Declined', `You declined your friend request from ${user.name}.`);
    } catch (error: any) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to declining friend request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  // For debugging
  useEffect(() => {
    console.log('Received', receivedRequests);
    console.log('Sent', sentRequests);
    console.log('Current status in render:', currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    // Force component to update when friend status changes
    // This effect runs whenever the friends, receivedRequests, or sentRequests arrays change
    const { status: latestStatus, requestId: latestRequestId } = getFriendStatus(user.id);

    console.log('friend status changes');
    console.log(latestStatus);
    // Only force update if there was an actual change in status
    if (latestStatus !== currentStatus) {
      console.log('Friend status changed:', currentStatus, '->', latestStatus);
    }
  }, [friends, receivedRequests, sentRequests]);

  return (
    <View style={styles.container}>
      {/* Header with back button - only show if requested */}
      {showHeader && (
        <View style={styles.header}>
          {!isCurrentUser && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{user.name}</Text>
          <View style={{ width: 50 }} />
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={user.profilePicture ? { uri: user.profilePicture } : images.defaultpfp}
            style={styles.profileImage}
          />
          <Text style={styles.userName}>{user.name}</Text>
        </View>

        {/* Friend Request Button - Only show if not current user */}
        {!isCurrentUser && (
          <View style={styles.actionButtonContainer}>
            {currentStatus === FriendStatus.INCOMING_REQUEST ? (
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
                  onPress={handleRejectFriendRequest}
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
            ) : currentStatus === FriendStatus.NONE ? (
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
            ) : currentStatus === FriendStatus.PENDING ? (
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
        )}

        {/* Sign Out Button - Only show for current user */}
        {isCurrentUser && (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 0,
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
  signOutButton: {
    marginHorizontal: 24,
    marginTop: 10,
    marginBottom: 40,
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#666',
    fontSize: 16,
  },
});

export default UserProfile;

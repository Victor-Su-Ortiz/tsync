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
  SafeAreaView
} from "react-native";
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
    bio?: string;
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
  onBackPress
}: UserProfileProps) => {
  const router = useRouter();
  const [user, setUser] = useState(userData);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<FriendStatus>(
    userData?.friendStatus || FriendStatus.NONE
  );
  const [requestId, setRequestId] = useState<string | undefined>(userData?.requestId);

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
    loading
  } = useFriends();

  // Update local state when props change
  useEffect(() => {
    setUser(userData);
    console.log("USER PROFILE AND USERDATA", userData);
  }, [userData]);

  // Refresh friend data when component mounts
  useEffect(() => {
    refreshFriendData();
    console.log("=========================================");

    const sent = sentRequests.find(req => req.receiver._id == userData.id);
    if (sent === undefined) {
      console.log("No FRQ found");
    } else {
      console.log("FRQ Found:", sent);
      setRequestId(sent._id);
      setCurrentStatus(FriendStatus.PENDING);
      return
    }

    const received = receivedRequests.find(req => req.sender._id == userData.id);
    if (received === undefined) {
      console.log("No FRQ received");
    } else {
      console.log("FRQ received:", received);
      setRequestId(received._id);
      setCurrentStatus(FriendStatus.INCOMING_REQUEST);
      return
    }

    setCurrentStatus(FriendStatus.NONE);
    console.log("Current Status:", currentStatus);

  }, []);

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
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !user.id) return;

    setIsLoading(true);

    try {
      await sendFriendRequest(user.id);
      setCurrentStatus(FriendStatus.PENDING);

      // Find the request ID from the sent requests after refreshing
      await refreshFriendData();
      const sentRequest = sentRequests.find(req => req.receiver._id === user.id);
      if (sentRequest) {
        setRequestId(sentRequest._id);
      } else {
        console.log("Failed to find the sent request");
      }
      Alert.alert("Friend Request Sent", `Your friend request to ${user.name} has been sent.`);
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to send friend request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    const req = sentRequests.find(req => req.receiver._id == user.id);
    const requestId = req?._id;
    console.log(req);
    if (!requestId) return;

    console.log("attempt to cancel friend request with id:", requestId);

    setIsLoading(true);

    try {
      await cancelFriendRequest(requestId);
      setCurrentStatus(FriendStatus.NONE);
      setRequestId(undefined);
      Alert.alert("Request Cancelled", "Friend request has been cancelled.");
    } catch (error: any) {
      console.error("Error cancelling request:", error);
      Alert.alert("Error", "Failed to cancel request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!requestId) return;

    setIsLoading(true);

    try {
      await acceptFriendRequest(requestId);
      setCurrentStatus(FriendStatus.FRIENDS);
      Alert.alert("Friend Request Accepted", `You are now friends with ${user.name}.`);
    } catch (error: any) {
      console.error("Error accepting friend request:", error);
      Alert.alert("Error", "Failed to accept friend request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectFriendRequest = async () => {
    if (!requestId) return;

    setIsLoading(true);

    try {
      await rejectFriendRequest(requestId);
      setCurrentStatus(FriendStatus.NONE);
      Alert.alert("Friend Request Declined", `Friend request from ${user.name} has been declined.`);
    } catch (error: any) {
      console.error("Error declining friend request:", error);
      Alert.alert("Error", "Failed to decline friend request");
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

  // useEffect(() => { console.log("current status", currentStatus) });

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

        {/* Profile Information */}
        <View style={styles.infoContainer}>
          <View style={styles.bioContainer}>
            {user.bio && (
              <>
                <Text style={styles.bioLabel}>About</Text>
                <Text style={styles.bioText}>{user.bio}</Text>
              </>
            )}
          </View>
        </View>

        {/* Sign Out Button - Only show for current user */}
        {isCurrentUser && (
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
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
  }
});

export default UserProfile;
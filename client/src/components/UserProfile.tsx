// src/components/UserProfile.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import { FriendStatus } from '@/src/utils/enums';
import { RelativePathString, useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import images from '@/src/constants/images';
import { useFriends } from '../context/FriendRequestContext';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

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
  const { authToken, logout, userInfo } = useAuth();
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
  const [showQRModal, setShowQRModal] = useState(false);
  const { status: currentStatus, requestId } = getFriendStatus(user.id);
  const qrCodeRef = useRef<ViewShot>(null);

  // Generate QR data
  const qrData = JSON.stringify({
    type: 'friend-request',
    userId: isCurrentUser ? userInfo?.id : user.id,
    name: isCurrentUser ? userInfo?.name : user.name,
  });

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

  const toggleQRModal = () => {
    setShowQRModal(!showQRModal);
  };

  const handleShareQRCode = async () => {
    try {
      if (qrCodeRef.current) {
        // Capture QR code view as image
        const uri = await qrCodeRef.current.capture!();

        // Share the image
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Sharing not available', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const handleScanQRCode = () => {
    // Navigate to QR Scanner screen
    router.push('/qr-scanner' as RelativePathString);
  };

  const handleSendFriendRequest = async () => {
    if (!user || !user.id) return;

    setIsLoading(true);

    try {
      await sendFriendRequest(user.id);
      Alert.alert('Friend Request Sent', `Your friend request to ${user.name} has been sent.`);
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    const { status: latestStatus } = getFriendStatus(user.id);

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

          {/* QR Code Button */}
          <View style={styles.qrButtonContainer}>
            <TouchableOpacity style={styles.qrButton} onPress={toggleQRModal}>
              <Ionicons name="qr-code" size={20} color="#fff" />
              <Text style={styles.qrButtonText}>
                {isCurrentUser ? 'Show My QR Code' : 'View QR Code'}
              </Text>
            </TouchableOpacity>

            {isCurrentUser && (
              <TouchableOpacity style={styles.scanButton} onPress={handleScanQRCode}>
                <Ionicons name="scan" size={20} color="#fff" />
                <Text style={styles.qrButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
            )}
          </View>
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

      {/* QR Code Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showQRModal}
        onRequestClose={toggleQRModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={toggleQRModal}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>
              {isCurrentUser ? 'My Friend QR Code' : `${user.name}'s QR Code`}
            </Text>

            <ViewShot ref={qrCodeRef} style={styles.qrCodeContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrData}
                  size={200}
                  color="#000"
                  backgroundColor="#fff"
                  logo={images.defaultpfp}
                  logoSize={50}
                  logoBackgroundColor="#fff"
                  logoMargin={5}
                />
                <Text style={styles.qrUserName}>{isCurrentUser ? userInfo?.name : user.name}</Text>
              </View>
            </ViewShot>

            <Text style={styles.qrInstructions}>
              Scan this QR code to quickly send a friend request
            </Text>

            {isCurrentUser && (
              <TouchableOpacity style={styles.shareButton} onPress={handleShareQRCode}>
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={styles.buttonText}>Share QR Code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  qrButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  qrButton: {
    backgroundColor: '#7e57c2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  scanButton: {
    backgroundColor: '#5c6bc0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  qrButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  qrUserName: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  qrInstructions: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#00cc99',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
  },
});

export default UserProfile;

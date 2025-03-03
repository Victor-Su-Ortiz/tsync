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

type User = {
  id: string;
  name: string;
  distance: number;
  profileImage?: string;
  bio?: string;
  favoriteTea?: string;
  joinedDate?: string;
  friendStatus?: 'none' | 'pending' | 'friends';
};

type UserProfileProps = {
  visible: boolean;
  onClose: () => void;
  user: User | null;
};

const UserProfile = ({ visible, onClose, user }: UserProfileProps) => {
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending' | 'friends'>(
    user?.friendStatus || 'none'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Update friend status when user changes
  useEffect(() => {
    if (user) {
      console.log('User profile loaded:', user.name); // Debug log
      setFriendRequestStatus(user.friendStatus || 'none');
    }
  }, [user]);

  const handleSendFriendRequest = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Here you would make an API call to your backend to send a friend request
      // For example:
      // await axios.post('https://your-api.com/friend-requests', { userId: user.id });

      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the friend status to pending
      setFriendRequestStatus('pending');

      // Show success message
      Alert.alert("Friend Request Sent", `Your friend request to ${user.name} has been sent.`);
    } catch (error) {
      console.error("Error sending friend request:", error);
      Alert.alert("Error", "Failed to send friend request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      // Here you would make an API call to your backend to cancel the friend request
      // For example:
      // await axios.delete(`https://your-api.com/friend-requests/${user.id}`);

      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the friend status to none
      setFriendRequestStatus('none');

      // Show success message
      Alert.alert("Request Cancelled", `Your friend request to ${user.name} has been cancelled.`);
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      Alert.alert("Error", "Failed to cancel friend request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
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
                source={{ uri: user.profileImage || "https://via.placeholder.com/150" }}
                style={styles.profileImage}
              />
              <Text style={styles.userName}>{user.name}</Text>
            </View>

            {/* Friend Request Button */}
            <View style={styles.actionButtonContainer}>
              {friendRequestStatus === 'none' ? (
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
              <View style={styles.infoItem}>
                <Ionicons name="leaf" size={22} color="#00cc99" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Favorite Tea</Text>
                  <Text style={styles.infoValue}>{user.favoriteTea || "Not specified"}</Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={22} color="#00cc99" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Joined</Text>
                  <Text style={styles.infoValue}>{user.joinedDate || "Recently"}</Text>
                </View>
              </View>

              <View style={styles.bioContainer}>
                <Text style={styles.bioLabel}>About</Text>
                <Text style={styles.bioText}>
                  {user.bio || "This user hasn't added a bio yet."}
                </Text>
              </View>
            </View>

            {/* Tea Event History - Placeholder */}
            <View style={styles.eventsContainer}>
              <Text style={styles.sectionTitle}>Recent Tea Events</Text>
              <View style={styles.eventPlaceholder}>
                <Ionicons name="calendar-outline" size={30} color="#ccc" />
                <Text style={styles.placeholderText}>No recent tea events</Text>
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
  friendRequestButton: {
    backgroundColor: '#00cc99',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 25,
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
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  bioContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
  eventsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  eventPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  placeholderText: {
    marginTop: 8,
    color: '#888',
    fontSize: 16,
  },
});

export default UserProfile;
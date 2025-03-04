// components/UserSearch.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Alert,
  Text,
  ActivityIndicator,
  FlatList,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import UserProfile from './UserProfile';
import { debounce } from 'lodash';
import { api } from '../utils/api'; // Import your API utility

type User = {
  id: string;
  name: string;
  profileImage?: string;
  bio?: string;
  favoriteTea?: string;
  joinedDate?: string;
  friendStatus?: 'none' | 'pending' | 'friends';
};

type UserSearchProps = {
  visible: boolean;
  onClose: () => void;
  accessToken: string;
};


const UserSearch = ({ visible, onClose, accessToken }: UserSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Create a debounced search function to prevent too many searches as user types
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length > 0) {
        searchUsers(query);
      } else {
        // Clear results if search query is empty
        setUsers([]);
        setHasSearched(false);
      }
    }, 300), // 300ms delay
    []
  );

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2JmYzBmNWM0ZDAxZDVhMzdmMDNhM2EiLCJlbWFpbCI6Im5mMjQzQGNvcm5lbGwuZWR1Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NDEwNDM1OTcsImV4cCI6MTc0MTEyOTk5N30.x_shP3WMsSTDNs-LwbBJyriIOBjnIWX_ssdcbVRXZss';

  useEffect(() => {

    // Reset state when modal opens
    if (visible) {
      setSearchQuery('');
      setHasSearched(false);

      // Focus the input field when the modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [visible]);

  // Trigger the debounced search when searchQuery changes
  useEffect(() => {
    debouncedSearch(searchQuery);

    // Cancel any pending debounced searches on cleanup
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);



  const searchUsers = async (query: string = searchQuery) => {
    console.log("🔑 Auth Token Retrieved:", token);
    console.log("🔎 searchUsers function is being called with query:", query);

    if (!query.trim()) {
      console.log("⚠️ Empty query, exiting searchUsers");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    if (!accessToken) {
      console.log("🚨 No access token found! Exiting search.");
      setIsSearching(false);
      return;
    }

    try {
      console.log("📡 Making API request...");
      const response = await api.post(
        '/users/search',
        { q: query, limit: 10 },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("✅ API Response:", response.data);

      const searchedUsers = response.data.users || [];
      console.log("👥 Users found:", searchedUsers.length);

      setUsers(searchedUsers);
    } catch (error: any) {
      console.error("❌ Error searching for users:", error);
      console.error("⚠️ API Error Response:", error.response?.status, error.response?.data);
    } finally {
      console.log("⏳ Finished searching, updating UI...");
      setIsSearching(false);
    }
  };



  const handleUserPress = (user: User) => {
    console.log('User pressed:', user.name); // Debug log
    // Set the selected user and show their profile
    setSelectedUser(user);
    // Add a slight delay to ensure the state updates before showing the profile
    setTimeout(() => {
      setProfileVisible(true);
    }, 50);
  };

  const handleProfileClose = () => {
    setProfileVisible(false);
    // Delay clearing the selected user to prevent visual glitches
    setTimeout(() => setSelectedUser(null), 300);
  };

  // Handle text input changes
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    // The search will be triggered by the useEffect that watches searchQuery
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.container}>
          {/* Header with close button and search input */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Search for nearby users..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
                clearButtonMode="while-editing"
                autoFocus={true}
              />
            </View>
          </View>

          {/* User Results */}
          {isSearching ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#00cc99" />
              <Text style={styles.loadingText}>Searching users...</Text>
            </View>
          ) : hasSearched ? (
            users.length > 0 ? (
              <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => handleUserPress(item)}
                  >
                    <Image
                      source={{ uri: item.profileImage || "https://via.placeholder.com/150" }}
                      style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.name}</Text>
                      {item.friendStatus === 'pending' && (
                        <View style={styles.friendStatusPending}>
                          <Ionicons name="time-outline" size={14} color="#F9A826" />
                          <Text style={[styles.friendStatusText, { color: '#F9A826' }]}>
                            Friend Request Pending
                          </Text>
                        </View>
                      )}
                      {item.friendStatus === 'friends' && (
                        <View style={styles.friendStatusFriends}>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#00cc99" />
                          <Text style={[styles.friendStatusText, { color: '#00cc99' }]}>
                            Friends
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.userList}
              />
            ) : (
              <View style={styles.centered}>
                <Ionicons name="search-outline" size={50} color="#ccc" />
                <Text style={styles.noUsersText}>No users found matching "{searchQuery}"</Text>
              </View>
            )
          ) : (
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={70} color="#ddd" />
              <Text style={styles.instructionText}>Search for tea enthusiasts</Text>
            </View>
          )}

          {/* User Profile Modal - Now rendered inside the search modal */}
          {selectedUser && (
            <UserProfile
              visible={profileVisible}
              onClose={handleProfileClose}
              user={selectedUser}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: Platform.OS === 'ios' ? 40 : 0, // Add top margin for iOS status bar
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginLeft: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  userList: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 4,
  },
  userDistance: {
    fontSize: 14,
    color: '#666',
  },
  friendStatusPending: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendStatusFriends: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendStatusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  noUsersText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  instructionText: {
    marginTop: 12,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});

export default UserSearch;
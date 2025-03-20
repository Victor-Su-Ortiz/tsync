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
import { FriendStatus } from '../utils/enums';

// Define request interface for consistency
export interface FriendRequestData {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  receiver: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export type User = {
  id: string;
  _id?: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  favoriteTea?: string;
  joinedDate?: string;
  friendStatus?: FriendStatus;
  requestId?: string; // Store requestId when relevant
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
  
  // Cache of friend requests to avoid repeated API calls
  const [friendRequestsCache, setFriendRequestsCache] = useState<{
    incoming: Record<string, string>, // userId -> requestId
    outgoing: Record<string, string>, // userId -> requestId
    friends: string[] // array of friend userIds
  }>({
    incoming: {},
    outgoing: {},
    friends: []
  });

  // Define the searchUsers function without debounce first
  const searchUsers = async (query: string) => {

    if (!query.trim()) {
      console.log("⚠️ Empty query, exiting searchUsers");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    if (!accessToken) {
      setIsSearching(false);
      return;
    }

    try {
      // Get search results
      const searchResponse = await api.get(
        '/users/search',
        {
          params: { q: query, limit: 10 },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const searchedUsers = searchResponse.data.users || [];

      // Get the current friend requests cache state
      // This ensures we use the latest state
      const currentCache = friendRequestsCache;
      console.log("Current Cache:", currentCache);
      // console.log("Searched Users:", searchedUsers);

      // Apply friend statuses from our cache
      const updatedUsers = searchedUsers.map((user: User) => {
        const userId = user._id || user.id;

        // Apply friend status based on our cached data
        let friendStatus = FriendStatus.NONE;
        let requestId: string | undefined = undefined;

        // Check if they're already friends
        if (currentCache.friends.includes(userId)) {
          friendStatus = FriendStatus.FRIENDS;
        }
        // Check if we have an incoming request from them
        else if (userId in currentCache.incoming) {
          friendStatus = FriendStatus.INCOMING_REQUEST;
          requestId = currentCache.incoming[userId];
        }
        // Check if we sent them a request
        else if (userId in currentCache.outgoing) {
          friendStatus = FriendStatus.PENDING;
          requestId = currentCache.outgoing[userId];
        }
        console.log("User:", user.name, "Status:", friendStatus);

        return { 
          ...user, 
          id: userId, // Ensure id is consistently available
          friendStatus,
          requestId
        };
      });

      setUsers(updatedUsers);
    } catch (error: any) {
      console.error("❌ Error searching for users:", error);
      console.error("⚠️ API Error Response:", error.response?.status, error.response?.data);

      // Just show empty results if there's an error
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Create a debounced search function
  // The key fix is to NOT use useCallback for this, as we need it to be recreated when dependencies change
  useEffect(() => {
    const debouncedSearchFn = debounce((query: string) => {
      if (query.trim().length > 0) {
        searchUsers(query);
      } else {
        // Clear results if search query is empty
        setUsers([]);
        setHasSearched(false);
      }
    }, 300); // 300ms delay

    // Trigger the debounced search when searchQuery changes
    if (searchQuery) {
      debouncedSearchFn(searchQuery);
    }

    // Cleanup
    return () => {
      debouncedSearchFn.cancel();
    };
  }, [searchQuery, friendRequestsCache, accessToken]); // Include dependencies

  // Fetch all friend-related data at component mount and when modal opens
  useEffect(() => {
    if (visible && accessToken) {
      fetchFriendData();
    }
  }, [visible, accessToken]);

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

  // Efficiently fetch all friend data in a single batch
  const fetchFriendData = async () => {
    if (!accessToken) return;

    try {
      // Fetch all friend relationships in parallel for efficiency
      const [incomingResponse, outgoingResponse, friendsResponse] = await Promise.all([
        api.get('/friends/requests/received/pending', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        api.get('/friends/requests/sent/pending', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        api.get('/friends', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);
      // console.log('incoming request data:', incomingResponse.data);
      // console.log('outgoing request data:', outgoingResponse.data);
      // console.log('friends data:', friendsResponse.data);

      // Process incoming requests
      const incomingRequests: Record<string, string> = {};
      if (incomingResponse.data.requests && Array.isArray(incomingResponse.data.requests)) {
        incomingResponse.data.requests.forEach((request: FriendRequestData) => {
          const senderId = request.sender._id;
          incomingRequests[senderId] = request._id; // Store request ID for accept/reject operations
        });
      }

      // Process outgoing requests
      const outgoingRequests: Record<string, string> = {};
      if (outgoingResponse.data.requests && Array.isArray(outgoingResponse.data.requests)) {
        outgoingResponse.data.requests.forEach((request: FriendRequestData) => {
          const recipientId = request.receiver._id;
          outgoingRequests[recipientId] = request._id; // Store request ID for cancel operations
        });
      }

      // Process friends list
      const friendsList: string[] = [];
      if (friendsResponse.data.friends && Array.isArray(friendsResponse.data.friends)) {
        friendsResponse.data.friends.forEach((friend: any) => {
          friendsList.push(friend._id);
        });
      }

      // Update cache
      setFriendRequestsCache({
        incoming: incomingRequests,
        outgoing: outgoingRequests,
        friends: friendsList
      });

      console.log('Friend data loaded:', {
        incomingCount: Object.keys(incomingRequests).length,
        outgoingCount: Object.keys(outgoingRequests).length,
        friendsCount: friendsList.length
      });
    } catch (error) {
      console.error('Error fetching friend data:', error);
    }
  };

  // Handle friend status changes from the UserProfile component
  const handleFriendStatusChange = (userId: string, newStatus: FriendStatus, requestId?: string) => {
    console.log("updating friend status for user:", userId, "to:", newStatus, "requestId:", requestId);
    // Update our cache based on the new status
    const newCache = { ...friendRequestsCache };
    
    // Remove from all categories first
    delete newCache.incoming[userId];
    delete newCache.outgoing[userId];
    newCache.friends = newCache.friends.filter(id => id !== userId);
    
    // Then add to the appropriate category
    if (newStatus === FriendStatus.FRIENDS) {
      newCache.friends.push(userId);
    } else if (newStatus === FriendStatus.PENDING && requestId) {
      newCache.outgoing[userId] = requestId;
    } else if (newStatus === FriendStatus.INCOMING_REQUEST && requestId) {
      newCache.incoming[userId] = requestId;
    }
    
    setFriendRequestsCache(newCache);

    // Also update the search results list if this user is in it
    setUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? { ...user, friendStatus: newStatus, requestId }
          : user
      )
    );
  };

  const handleUserPress = (user: User) => {
    console.log("Selected user:", user);
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
                      source={{ uri: item.profilePicture || "https://via.placeholder.com/150" }}
                      style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.name}</Text>
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

          {/* User Profile Modal */}
          {selectedUser && (
            <UserProfile
              visible={profileVisible}
              onClose={handleProfileClose}
              user={selectedUser}
              onFriendStatusChange={handleFriendStatusChange}
              requestId={selectedUser.requestId}
              requestStatus={selectedUser.friendStatus}
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
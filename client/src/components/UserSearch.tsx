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
import { debounce } from 'lodash'; // You'll need to install this dependency

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
};

const UserSearch = ({ visible, onClose }: UserSearchProps) => {
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
    [] // No dependencies since we're not using location
  );

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
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Here you would make an API call to your backend to search for users
      // This is a placeholder implementation
      // Replace with your actual API endpoint

      const apiUrl = `https://your-backend-api.com/users/search?query=${encodeURIComponent(query)}`;

      // For demonstration purposes, using mock data
      // In a real app, you would do:
      // const response = await axios.get(apiUrl);
      // const searchedUsers = response.data;

      // Mock data for demonstration with additional profile details
      setTimeout(() => {
        const mockUsers: User[] = [
          {
            id: '1',
            name: 'Tea Lover Alice',
            profileImage: 'https://via.placeholder.com/150',
            bio: 'Tea enthusiast exploring the world one cup at a time. I love finding new tea shops and meeting fellow tea lovers.',
            favoriteTea: 'Jasmine Green Tea',
            joinedDate: 'March 2023',
            friendStatus: 'none' as 'none'
          },
          {
            id: '2',
            name: 'Matcha Master Bob',
            profileImage: 'https://via.placeholder.com/150',
            bio: 'Certified tea specialist with a passion for Japanese tea ceremonies and matcha preparation.',
            favoriteTea: 'Ceremonial Grade Matcha',
            joinedDate: 'January 2024',
            friendStatus: 'pending' as 'pending'
          },
          {
            id: '3',
            name: 'Chai Charlie',
            profileImage: 'https://via.placeholder.com/150',
            bio: 'I travel around searching for the perfect chai blend. Let\'s meet up for a tea session!',
            favoriteTea: 'Masala Chai',
            joinedDate: 'November 2023',
            friendStatus: 'friends' as 'friends'
          },
          {
            id: '4',
            name: 'Darjeeling Dave',
            profileImage: 'https://via.placeholder.com/150',
            bio: 'Tea collector and connoisseur. I host monthly tea tasting events in my local area.',
            favoriteTea: 'First Flush Darjeeling',
            joinedDate: 'August 2023',
            friendStatus: 'none' as 'none'
          },
          {
            id: '5',
            name: 'Earl Grey Emma',
            profileImage: 'https://via.placeholder.com/150',
            bio: 'Tea blogger and photographer. I love capturing the perfect tea moment.',
            favoriteTea: 'Earl Grey with Lavender',
            joinedDate: 'February 2024',
            friendStatus: 'none' as 'none'
          },
        ].filter(user =>
          user.name.toLowerCase().includes(query.toLowerCase())
        );

        setUsers(mockUsers);
        setIsSearching(false);
      }, 1000);

    } catch (error) {
      console.error("Error searching for users:", error);
      Alert.alert("Error", "Failed to search for nearby users");
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
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* User Results */}
          {isSearching ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#00cc99" />
              <Text style={styles.loadingText}>Searching nearby users...</Text>
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
              <Text style={styles.instructionText}>Search for nearby tea enthusiasts</Text>
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
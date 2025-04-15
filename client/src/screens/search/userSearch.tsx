import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  ActivityIndicator,
  FlatList,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { debounce } from 'lodash';
import { api } from '@/src/utils/api';
import { FriendStatus } from '@/src/utils/enums';
import { router, useNavigation } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type User = {
  id: string;
  _id?: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  favoriteTea?: string;
  joinedDate?: string;
  friendStatus?: FriendStatus;
};

const UserSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { authToken } = useAuth();

  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // Define the searchUsers function
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    if (!authToken) {
      setIsSearching(false);
      return;
    }

    try {
      // Get search results
      const searchResponse = await api.get('/users/search', {
        params: { q: query, limit: 10 },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const searchedUsers = searchResponse.data.users || [];

      // Simplified user mapping - just ensure ID is consistent
      const updatedUsers = searchedUsers.map((user: User) => {
        const userId = user._id || user.id;

        return {
          ...user,
          id: userId,
        };
      });

      setUsers(updatedUsers);
    } catch (error: any) {
      console.error('Error searching for users:', error);
      // Just show empty results if there's an error
      setUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Create a debounced search function
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
  }, [searchQuery, authToken]); // Include dependencies

  // Focus the input field on component mount
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, []);

  const handleUserPress = (user: User) => {
    console.log('Selected user:', user);

    router.push({
      pathname: './../profile/userProfile',
      params: {
        userData: JSON.stringify(user),
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  // Handle text input changes
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'white' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.container}>
        {/* Header with back button and search input */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
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
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.userItem} onPress={() => handleUserPress(item)}>
                  <Image
                    source={{ uri: item.profilePicture || 'https://via.placeholder.com/150' }}
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
      </View>
    </KeyboardAvoidingView>
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
    paddingVertical: 6,
    marginTop: Platform.OS === 'ios' ? 40 : 0, // Add top margin for iOS status bar
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
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

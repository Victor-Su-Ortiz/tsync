// components/UserSearch.tsx
import React, { useEffect, useState, useRef } from 'react';
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
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

type User = {
  id: string;
  name: string;
  distance: number; // distance in meters
  profileImage?: string;
};

type UserSearchProps = {
  visible: boolean;
  onClose: () => void;
  location: Location.LocationObjectCoords | null;
};

const UserSearch = ({ visible, onClose, location }: UserSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

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

  const searchNearbyUsers = async () => {
    if (!location || !searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Here you would make an API call to your backend to search for users
      // This is a placeholder implementation
      // Replace with your actual API endpoint

      const apiUrl = `https://your-backend-api.com/users/nearby?lat=${location.latitude}&lng=${location.longitude}&query=${encodeURIComponent(searchQuery)}`;

      // For demonstration purposes, using mock data
      // In a real app, you would do:
      // const response = await axios.get(apiUrl);
      // const nearbyUsers = response.data;

      // Mock data for demonstration
      setTimeout(() => {
        const mockUsers: User[] = [
          { id: '1', name: 'Tea Lover Alice', distance: 300, profileImage: 'https://via.placeholder.com/100' },
          { id: '2', name: 'Matcha Master Bob', distance: 750, profileImage: 'https://via.placeholder.com/100' },
          { id: '3', name: 'Chai Charlie', distance: 1200, profileImage: 'https://via.placeholder.com/100' },
          { id: '4', name: 'Darjeeling Dave', distance: 1800, profileImage: 'https://via.placeholder.com/100' },
          { id: '5', name: 'Earl Grey Emma', distance: 2500, profileImage: 'https://via.placeholder.com/100' },
        ].filter(user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase())
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
    // Navigate to user profile or perform another action
    console.log("User pressed:", user.name);
    // Implementation for user interaction - replace with actual navigation
    Alert.alert("User Selected", `You selected ${user.name}`);
    // Optionally close the modal after selection
    // onClose();
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
                onChangeText={setSearchQuery}
                onSubmitEditing={searchNearbyUsers}
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
                      source={{ uri: item.profileImage || "https://via.placeholder.com/100" }}
                      style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <Text style={styles.userDistance}>
                        {item.distance < 1000
                          ? `${item.distance} m away`
                          : `${(item.distance / 1000).toFixed(1)} km away`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
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
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Animated,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api'; // Import your API utility
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useAuth } from '../context/AuthContext';

const FriendsDropdown = ({ selectedFriends, setSelectedFriends }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Animate overlay when modal visibility changes
  useEffect(() => {
    if (modalVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  // Fetch friends when component mounts or modal opens
  useEffect(() => {
    if (modalVisible) {
      fetchFriends();
    }
  }, [modalVisible]);

  const fetchFriends = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use api.get instead of api.post since the controller handles GET requests
      const token = await AsyncStorage.getItem("authToken");
      const response = await api.get('/friends/friends', {headers: { Authorization: `Bearer ${token}` }});
      const { success, friends } = response.data;

      // Based on your controller, response should have a structure with success and data fields
      if (!response || !success || !Array.isArray(friends)) {
        throw new Error('Unexpected API response format');
      }

      // Your controller already populates friend details, so we can use them directly
      setFriends(friends);
      setFilteredFriends(friends);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter friends based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = friends.filter(friend =>
        friend.name && friend.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [searchQuery, friends]);

  // Check if a friend is selected
  const isFriendSelected = (friendId) => {
    return selectedFriends.some(friend => friend._id === friendId);
  };

  // Toggle friend selection
  const toggleFriendSelection = (friend) => {
    if (isFriendSelected(friend._id)) {
      setSelectedFriends(selectedFriends.filter(f => f._id !== friend._id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  // Extract first letter of name for avatar
  const getInitial = (name) => {
    return name && typeof name === 'string' ? name.charAt(0).toUpperCase() : '?';
  };

  // Render each friend item
  const renderFriendItem = ({ item }) => {
    const isSelected = isFriendSelected(item._id);

    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          isSelected && styles.selectedFriendItem
        ]}
        onPress={() => toggleFriendSelection(item)}
      >
        <View style={styles.friendInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(item.name)}</Text>
          </View>
          <Text style={[
            styles.friendName,
            isSelected && styles.selectedFriendName
          ]}>
            {item.name || `User ${item._id.slice(-5)}`}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#00cc99" />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#00cc99" />
          <Text style={styles.emptyStateText}>Loading friends...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="alert-circle-outline" size={40} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchFriends}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (friends.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="people-outline" size={40} color="#aaa" />
          <Text style={styles.emptyStateText}>You don't have any friends yet</Text>
        </View>
      );
    }

    if (searchQuery && filteredFriends.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="search-outline" size={40} color="#aaa" />
          <Text style={styles.emptyStateText}>No friends match your search</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedFriends.length ? styles.dropdownText : styles.placeholderText}>
          {selectedFriends.length
            ? `${selectedFriends.length} friend${selectedFriends.length !== 1 ? 's' : ''} selected`
            : "Select friends"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#aaa" />
      </TouchableOpacity>

      {selectedFriends.length > 0 && (
        <View style={styles.selectedContainer}>
          <FlatList
            data={selectedFriends}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.selectedFriendChip}>
                <Text style={styles.chipAvatar}>{getInitial(item.name)}</Text>
                <Text style={styles.selectedFriendChipText}>
                  {item.name || `User ${item._id.slice(-5)}`}
                </Text>
                <TouchableOpacity
                  onPress={() => toggleFriendSelection(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Animated overlay with fade effect */}
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: fadeAnim }
          ]}
        />

        {/* Modal content - slides up from bottom */}
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Friends</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#aaa" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search friends..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={20} color="#aaa" />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item._id}
              renderItem={renderFriendItem}
              style={styles.friendsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={filteredFriends.length === 0 ? { flex: 1 } : null}
            />

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#aaa',
  },
  selectedContainer: {
    marginTop: 8,
  },
  selectedFriendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFriendChipText: {
    marginLeft: 6,
    marginRight: 6,
    fontSize: 14,
    color: '#333',
  },
  chipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00cc99',
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 15,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  friendsList: {
    flex: 1,
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f7fa',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00cc99',
  },
  selectedFriendItem: {
    backgroundColor: '#f0f9f6',
  },
  friendName: {
    fontSize: 16,
    color: '#333',
  },
  selectedFriendName: {
    fontWeight: '500',
    color: '#00cc99',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#ff6b6b',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#00cc99',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: '#00cc99',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FriendsDropdown;
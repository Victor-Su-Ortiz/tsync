import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { api } from '@/src/utils/api';

// Define type for preferences
type Preference = {
  _id: string;
  text: string;
  isActive: boolean;
  createdAt: string;
};

const UserPreferences = () => {
  const router = useRouter();
  const { authToken } = useAuth();
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPreference, setEditingPreference] = useState<Preference | null>(null);
  const [preferenceText, setPreferenceText] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/preferences', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setPreferences(response.data.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      Alert.alert('Error', 'Failed to load preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPreference = async () => {
    if (!preferenceText.trim()) {
      Alert.alert('Error', 'Please enter preference text');
      return;
    }

    try {
      if (editingPreference) {
        // Update existing preference
        await api.put(`/users/preferences/${editingPreference._id}`, { text: preferenceText.trim() }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        Alert.alert('Success', 'Preference updated successfully');
      } else {
        // Add new preference
        await api.post('/users/preferences', { text: preferenceText.trim() }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        Alert.alert('Success', 'Preference added successfully');
      }

      // Reset form and reload preferences
      setModalVisible(false);
      setPreferenceText('');
      setEditingPreference(null);
      fetchPreferences();

    } catch (error) {
      console.error('Error saving preference:', error);
      Alert.alert('Error', 'Failed to save preference. Please try again.');
    }
  };

  const handleEditPreference = (preference: Preference) => {
    setEditingPreference(preference);
    setPreferenceText(preference.text);
    setModalVisible(true);
  };

  const handleDeletePreference = async (preferenceId: string) => {
    Alert.alert(
      'Delete Preference',
      'Are you sure you want to delete this preference?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/users/preferences/${preferenceId}`, {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              });

              // Remove from local state
              setPreferences(preferences.filter(p => p._id !== preferenceId));
              Alert.alert('Success', 'Preference deleted successfully');
            } catch (error) {
              console.error('Error deleting preference:', error);
              Alert.alert('Error', 'Failed to delete preference. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleTogglePreference = async (preferenceId: string) => {
    try {
      await api.patch(`/users/preferences/${preferenceId}/toggle`, {}, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Update local state
      setPreferences(preferences.map(p =>
        p._id === preferenceId ? { ...p, isActive: !p.isActive } : p
      ));
    } catch (error) {
      console.error('Error toggling preference:', error);
      Alert.alert('Error', 'Failed to update preference. Please try again.');
    }
  };

  const handleAddNewPreference = () => {
    setPreferenceText('');
    setEditingPreference(null);
    setModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Preferences</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNewPreference}>
          <Ionicons name="add" size={24} color="#00cc99" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00cc99" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      ) : (
        <FlatList
          data={preferences}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceHeader}>
                <View style={[styles.statusIndicator, item.isActive ? styles.activeIndicator : styles.inactiveIndicator]} />
                <Switch
                  value={item.isActive}
                  onValueChange={() => handleTogglePreference(item._id)}
                  trackColor={{ false: '#ddd', true: '#a7e3d2' }}
                  thumbColor={item.isActive ? '#00cc99' : '#999'}
                />
              </View>
              <Text style={[styles.preferenceText, !item.isActive && styles.inactiveText]}>
                {item.text}
              </Text>
              <View style={styles.preferenceFooter}>
                <Text style={styles.dateText}>Added: {formatDate(item.createdAt)}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditPreference(item)}
                  >
                    <Ionicons name="pencil" size={20} color="#4A90E2" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeletePreference(item._id)}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="options-outline" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>No preferences yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add preferences like "I prefer meetings in the morning" or "I'm unavailable on Fridays"
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleAddNewPreference}
              >
                <Text style={styles.emptyStateButtonText}>Add My First Preference</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={preferences.length === 0 ? { flex: 1 } : {}}
        />
      )}

      {/* Add/Edit Preference Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setPreferenceText('');
          setEditingPreference(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPreference ? 'Edit Preference' : 'Add Preference'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setPreferenceText('');
                  setEditingPreference(null);
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Preference:</Text>
            <TextInput
              style={styles.input}
              value={preferenceText}
              onChangeText={setPreferenceText}
              placeholder="E.g., I prefer afternoon meetings, I'm unavailable on Wednesdays"
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <Text style={styles.helpText}>
              Enter any scheduling preference in natural language. The AI will analyze this when suggesting meeting times.
            </Text>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddPreference}
            >
              <Text style={styles.saveButtonText}>
                {editingPreference ? 'Update Preference' : 'Add Preference'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  preferenceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activeIndicator: {
    backgroundColor: '#00cc99',
  },
  inactiveIndicator: {
    backgroundColor: '#999',
  },
  preferenceText: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 22,
  },
  inactiveText: {
    color: '#999',
  },
  preferenceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#666',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: '#00cc99',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 20,
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#00cc99',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default UserPreferences;
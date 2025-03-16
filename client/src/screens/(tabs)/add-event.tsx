import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FriendsDropdown from '../../components/FriendsDropdown';
import TeaShopSelectionModal from '../../components/SelectTeaShop';
import DateTimePickerModal, { DateTimeRange } from '../../components/DateTimePickerModal';
import { useAuth } from '@/src/context/AuthContext'; // Import your auth context
import { api } from '@/src/utils/api';

type Friend = {
  id: string;
  name: string;
  email: string;
};

type Place = {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  photos?: { photo_reference: string }[];
};

export default function AddEventScreen() {
  const params = useLocalSearchParams();
  const { authToken } = useAuth(); // Get the auth token from context
  const sourceScreen = params.sourceScreen as string;

  const [teaShopInfo, setTeaShopInfo] = useState('');
  const [teaShopAddress, setTeaShopAddress] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');

  // Replace single date/time with array of date/time ranges
  const [dateTimeRanges, setDateTimeRanges] = useState<DateTimeRange[]>([]);

  const [selectedFriends, setSelectedFriends] = useState([]);
  const [teaShopModalVisible, setTeaShopModalVisible] = useState(false);
  const [dateTimeModalVisible, setDateTimeModalVisible] = useState(false);

  // Track if form is dirty (has unsaved changes)
  const [formDirty, setFormDirty] = useState(false);

  // Track loading state during API calls
  const [isLoading, setIsLoading] = useState(false);

  // Check if tea shop info was passed via URL params
  useEffect(() => {
    if (params.teaShopName) {
      setTeaShopInfo(params.teaShopName as string);
      setFormDirty(true);
    }
  }, [params.teaShopName]);

  // Update formDirty state whenever any form field changes
  useEffect(() => {
    // We need to check if ANY of the fields have values to determine if form is dirty
    const hasChanges =
      teaShopInfo !== '' ||
      teaShopAddress !== '' ||
      eventName !== '' ||
      description !== '' ||
      dateTimeRanges.length > 0 ||
      selectedFriends.length > 0;

    setFormDirty(hasChanges);
  }, [teaShopInfo, teaShopAddress, eventName, description, dateTimeRanges, selectedFriends]);

  const handleSelectTeaShop = () => {
    setTeaShopModalVisible(true);
  };

  const handleTeaShopSelection = (teaShop: Place) => {
    setTeaShopInfo(teaShop.name);
    setTeaShopAddress(teaShop.vicinity);
  };

  // Navigate back to the source screen if available
  const navigateBack = () => {
    if (sourceScreen) {
      // Check if source screen is a valid path
      if (sourceScreen.startsWith('/')) {
        // For absolute paths just use them directly
        router.push(sourceScreen as any);
      } else {
        // For relative paths like "./events" ensure in correct format
        const normalizedPath = sourceScreen.startsWith('.')
          ? sourceScreen
          : `./${sourceScreen}`;

        router.push(normalizedPath as any);
      }
    } else {
      // If no source screen, just go back
      router.back();
    }
  };

  // Updated to navigate back to source screen
  const handleBackButton = () => {
    if (formDirty) {
      // Show confirmation dialog if there are unsaved changes
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              // Clear all form fields first
              setTeaShopInfo('');
              setTeaShopAddress('');
              setEventName('');
              setDescription('');
              setDateTimeRanges([]);
              setSelectedFriends([]);
              setFormDirty(false);

              // Navigate back to source screen
              navigateBack();
            }
          }
        ]
      );
    } else {
      // No changes to discard, just navigate back
      navigateBack();
    }
  };

  const handleAddEvent = async () => {
    // Validate form data
    if (!teaShopInfo || !eventName) {
      Alert.alert('Missing Information', 'Please fill in the tea shop info and event name');
      return;
    }

    if (dateTimeRanges.length === 0) {
      Alert.alert('Missing Date & Time', 'Please add at least one date and time for this event');
      return;
    }

    // Create the event object matching the server's expectations based on error messages
    const newEvent = {
      title: eventName,
      description,

      // Location should be a string, not an object
      location: teaShopInfo,

      // These fields are specifically required according to the error message
      startTime: dateTimeRanges[0].startTime.toISOString(),
      endTime: dateTimeRanges[0].endTime.toISOString(),

      // Use ISO strings for dates
      startDate: dateTimeRanges[0].startDate.toISOString(),
      endDate: dateTimeRanges[0].endDate.toISOString(),

      // Include other fields that might be required
      attendees: selectedFriends.map((friend) => ({
        userId: (friend as Friend).id,
        name: (friend as Friend).name,
        email: (friend as Friend).email,
      }))
    };

    try {
      setIsLoading(true);

      // Log the event data for debugging
      console.log('Sending event data:', JSON.stringify(newEvent, null, 2));

      // Call the API to create the event, with explicit auth header
      const response = await api.post('/events', newEvent, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Event created successfully:', response.data);

      // Reset form dirty state since we're saving
      setFormDirty(false);

      // Show success message and navigate back to source screen
      Alert.alert(
        'Success!',
        'Event has been created successfully.',
        [{
          text: 'OK', onPress: () => {
            navigateBack(), resetForm();
          }
        }]

      );
    } catch (error: any) {
      console.error('Error creating event:', error);

      // Show more detailed error message if possible
      let errorMessage = 'Failed to create the event. Please try again.';

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Error response:', error.response.data);
        console.log('Error status:', error.response.status);

        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your internet connection.';
      }

      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all form fields
  const resetForm = () => {
    setTeaShopInfo('');
    setTeaShopAddress('');
    setEventName('');
    setDescription('');
    setDateTimeRanges([]);
    setSelectedFriends([]);
    setFormDirty(false);
  };

  const formatDateTimeRangeSummary = () => {
    if (dateTimeRanges.length === 0) {
      return "Tap to add dates and times";
    }

    if (dateTimeRanges.length === 1) {
      const range = dateTimeRanges[0];
      const startDateStr = range.startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const endDateStr = range.endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      const startTimeStr = range.startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const endTimeStr = range.endTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      if (range.startDate.toDateString() === range.endDate.toDateString()) {
        return `${startDateStr}, ${startTimeStr}—${endTimeStr}`;
      } else {
        return `${startDateStr}—${endDateStr}, ${startTimeStr}—${endTimeStr}`;
      }
    }

    return `${dateTimeRanges.length} date/time ranges selected`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00cc99" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Event</Text>
        <View style={{ margin: 20 }}></View> {/* Empty view for centering and padding */}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Tea Shop Information</Text>
            <TouchableOpacity
              style={[styles.input, styles.teaShopButton]}
              onPress={handleSelectTeaShop}
            >
              <Text style={teaShopInfo ? styles.teaShopText : styles.placeholderText}>
                {teaShopInfo || "Tap to select a tea shop"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#aaa" />
            </TouchableOpacity>

            {teaShopAddress ? (
              <Text style={styles.addressText}>{teaShopAddress}</Text>
            ) : null}

            <Text style={styles.label}>Event Name</Text>
            <TextInput
              style={styles.input}
              value={eventName}
              onChangeText={setEventName}
              placeholder="Enter event name"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter event description"
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Date & Time</Text>
            <TouchableOpacity
              style={[styles.dateTimeButton, dateTimeRanges.length > 0 && styles.dateTimeButtonActive]}
              onPress={() => setDateTimeModalVisible(true)}
            >
              <Text
                style={dateTimeRanges.length > 0 ? styles.dateTimeText : styles.placeholderText}
              >
                {formatDateTimeRangeSummary()}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>

            {dateTimeRanges.length > 0 && (
              <View style={styles.rangesPreview}>
                {dateTimeRanges.map((range, index) => (
                  <View key={range.id} style={styles.rangePreviewItem}>
                    <Ionicons name="time-outline" size={16} color="#00cc99" style={styles.rangeIcon} />
                    <Text style={styles.rangePreviewText}>
                      {range.startDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                      {range.startDate.toDateString() !== range.endDate.toDateString() ?
                        ` — ${range.endDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}` :
                        ''}
                      {', '}
                      {range.startTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} — {range.endTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.label}>Invite Friends</Text>
            <FriendsDropdown
              selectedFriends={selectedFriends}
              setSelectedFriends={setSelectedFriends}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddEvent}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.addButtonText}>Create Event</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Tea Shop Selection Modal */}
      <TeaShopSelectionModal
        isVisible={teaShopModalVisible}
        onClose={() => setTeaShopModalVisible(false)}
        onSelectTeaShop={handleTeaShopSelection}
      />

      {/* Date & Time Range Modal */}
      <DateTimePickerModal
        isVisible={dateTimeModalVisible}
        onClose={() => setDateTimeModalVisible(false)}
        onConfirm={(selectedRanges) => setDateTimeRanges(selectedRanges)}
        existingRanges={dateTimeRanges}
        title="Select Dates"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  resetButton: {
    padding: 8,
  },
  resetButtonText: {
    color: '#00cc99',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  descriptionInput: {
    height: 100,
    paddingTop: 12,
  },
  teaShopButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teaShopText: {
    color: '#000',
    fontSize: 16,
  },
  placeholderText: {
    color: '#aaa',
    fontSize: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginLeft: 2,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  dateTimeButtonActive: {
    borderColor: '#00cc99',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#000',
  },
  rangesPreview: {
    marginTop: 8,
  },
  rangePreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rangeIcon: {
    marginRight: 6,
  },
  rangePreviewText: {
    fontSize: 14,
    color: '#555',
  },
  addButton: {
    backgroundColor: '#00cc99',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
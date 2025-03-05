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
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FriendsDropdown from '../../components/FriendsDropdown';
import TeaShopSelectionModal from '../../components/SelectTeaShop';
import DateTimePickerModal from '../../components/DateTimePickerModal';

type Friend = {
  id: string;
  name: string;
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
  const [teaShopInfo, setTeaShopInfo] = useState('');
  const [teaShopAddress, setTeaShopAddress] = useState('');
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [teaShopModalVisible, setTeaShopModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // Check if tea shop info was passed via URL params
  useEffect(() => {
    if (params.teaShopName) {
      setTeaShopInfo(params.teaShopName as string);
    }
  }, [params.teaShopName]);

  const handleSelectTeaShop = () => {
    setTeaShopModalVisible(true);
  };

  const handleTeaShopSelection = (teaShop: Place) => {
    setTeaShopInfo(teaShop.name);
    setTeaShopAddress(teaShop.vicinity);
  };

  const handleBackButton = () => {
    router.push('./events');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleAddEvent = () => {
    // Validate form data
    if (!teaShopInfo || !eventName) {
      Alert.alert('Missing Information', 'Please fill in the tea shop info and event name');
      return;
    }

    // Create the event object
    const newEvent = {
      teaShopInfo,
      teaShopAddress,
      eventName,
      description,
      date: date.toISOString().split('T')[0],
      time: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
      attendees: selectedFriends.map((friend) => ({
        id: (friend as Friend).id,
        name: (friend as Friend).name,
      }))
    };

    // Here you would typically save the event to your state/database
    console.log('New Event:', newEvent);

    // Show success message and navigate back to events tab
    Alert.alert(
      'Success!',
      'Event has been created successfully.',
      [{ text: 'OK', onPress: () => router.push('./events') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackButton} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#00cc99" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Event</Text>
        <View style={styles.placeholder} />
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

            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setDatePickerVisible(true)}
            >
              <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>

            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setTimePickerVisible(true)}
            >
              <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
              <Ionicons name="time-outline" size={20} color="#666" />
            </TouchableOpacity>

            <Text style={styles.label}>Invite Friends</Text>
            <FriendsDropdown
              selectedFriends={selectedFriends}
              setSelectedFriends={setSelectedFriends}
            />

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddEvent}
            >
              <Text style={styles.addButtonText}>Create Event</Text>
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

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onConfirm={(selectedDate) => setDate(selectedDate)}
        currentValue={date}
        mode="date"
        title="Select Date"
      />

      {/* Time Picker Modal */}
      <DateTimePickerModal
        isVisible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        onConfirm={(selectedTime) => setTime(selectedTime)}
        currentValue={time}
        mode="time"
        title="Select Time"
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
  dateTimeText: {
    fontSize: 16,
    color: '#000',
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
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
import DateTimePicker from '@react-native-community/datetimepicker';
import FriendsDropdown from '../../components/FriendsDropdown';
import TeaShopSelectionModal from '../../components/SelectTeaShop';

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [teaShopModalVisible, setTeaShopModalVisible] = useState(false);

  // Check if tea shop info was passed via URL params
  useEffect(() => {
    if (params.teaShopName) {
      setTeaShopInfo(params.teaShopName as string);
    }
  }, [params.teaShopName]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(Platform.OS === 'ios');
    setTime(currentTime);
  };

  const handleSelectTeaShop = () => {
    // Show the tea shop selection modal instead of navigating to another screen
    setTeaShopModalVisible(true);
  };

  const handleTeaShopSelection = (teaShop: Place) => {
    setTeaShopInfo(teaShop.name);
    setTeaShopAddress(teaShop.vicinity);
  };

  const handleBackButton = () => {
    // Always go to events when pressing back from add-event
    router.push('./events');
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
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{date.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <Text style={styles.label}>Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text>
                {time.getHours().toString().padStart(2, '0')}:
                {time.getMinutes().toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display="default"
                onChange={onTimeChange}
              />
            )}

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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
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
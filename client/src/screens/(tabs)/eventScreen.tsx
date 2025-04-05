import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { RelativePathString, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

// Define Event type
type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  // Add any other event properties you need
};

const EventScreen = () => {
  const router = useRouter();
  const { authToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from your API
  useEffect(() => {
    // For demo purposes, we'll use mock data
    // Replace with actual API call in production
    setTimeout(() => {
      const mockEvents = [
        {
          id: '1',
          title: 'Team Meeting',
          date: '2025-04-10',
          time: '10:00 AM - 11:30 AM',
          location: 'Conference Room A',
        },
        {
          id: '2',
          title: 'Coffee with Sarah',
          date: '2025-04-11',
          time: '2:00 PM - 3:00 PM',
          location: 'Starbucks Downtown',
        },
        {
          id: '3',
          title: 'Product Demo',
          date: '2025-04-12',
          time: '1:00 PM - 2:30 PM',
          location: 'Main Office',
        },
      ];
      setEvents(mockEvents);
      setLoading(false);
    }, 1000);
  }, []);

  // Navigate to event details when an event is clicked
  const handleEventPress = (eventId: string) => {
    // Important: Use the /(eventDetails)/ path instead of /events/
    router.push(`/(eventDetails)/${eventId}` as RelativePathString);
  };

  // Render each event item
  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity style={styles.eventCard} onPress={() => handleEventPress(item.id)}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
      <View style={styles.eventInfo}>
        <View style={styles.eventDetail}>
          <Ionicons name="calendar-outline" size={16} color="#00cc99" />
          <Text style={styles.eventDetailText}>{item.date}</Text>
        </View>
        <View style={styles.eventDetail}>
          <Ionicons name="time-outline" size={16} color="#00cc99" />
          <Text style={styles.eventDetailText}>{item.time}</Text>
        </View>
        {item.location && (
          <View style={styles.eventDetail}>
            <Ionicons name="location-outline" size={16} color="#00cc99" />
            <Text style={styles.eventDetailText}>{item.location}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Display loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00cc99" />
      </View>
    );
  }

  // Display message if no events
  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noEventsText}>No events found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.screenTitle}>Your Events</Text>
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 40,
  },
  listContainer: {
    paddingBottom: 80, // Add padding to avoid tabs overlap
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  eventInfo: {
    gap: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
  },
  noEventsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 100,
  },
});

export default EventScreen;

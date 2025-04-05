import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  attendees?: { id: string; name: string; picture?: string }[];
  organizer?: { id: string; name: string; picture?: string };
  // Add any other event properties you need
};

const EventDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { authToken } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For demo purposes, we'll use mock data
    // Replace with actual API call in production
    setTimeout(() => {
      // Mock event data based on ID
      const mockEvent = {
        id,
        title: id === '1' ? 'Team Meeting' : id === '2' ? 'Coffee with Sarah' : 'Product Demo',
        date: id === '1' ? '2025-04-10' : id === '2' ? '2025-04-11' : '2025-04-12',
        time:
          id === '1'
            ? '10:00 AM - 11:30 AM'
            : id === '2'
              ? '2:00 PM - 3:00 PM'
              : '1:00 PM - 2:30 PM',
        location:
          id === '1' ? 'Conference Room A' : id === '2' ? 'Starbucks Downtown' : 'Main Office',
        description:
          'This is a detailed description of the event. It contains all the information attendees need to know about what to expect, what to bring, and any preparation needed.',
        attendees: [
          { id: 'a1', name: 'John Smith' },
          { id: 'a2', name: 'Emily Johnson' },
          { id: 'a3', name: 'Michael Brown' },
        ],
        organizer: { id: 'o1', name: 'Alex Williams' },
      };
      setEvent(mockEvent);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00cc99" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{event.title}</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#00cc99" />
            <Text style={styles.detailText}>{event.date}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#00cc99" />
            <Text style={styles.detailText}>{event.time}</Text>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color="#00cc99" />
              <Text style={styles.detailText}>{event.location}</Text>
            </View>
          )}

          {event.organizer && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={20} color="#00cc99" />
              <Text style={styles.detailText}>Organized by {event.organizer.name}</Text>
            </View>
          )}
        </View>

        {event.description && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        {event.attendees && event.attendees.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Attendees ({event.attendees.length})</Text>
            {event.attendees.map(attendee => (
              <Text key={attendee.id} style={styles.attendeeName}>
                {attendee.name}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.button}>
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.buttonText}>Add to Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#ff6b6b' }]}>
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  backButton: {
    marginTop: 40,
    marginBottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
  },
  sectionCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  attendeeName: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#00cc99',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 0.48,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#666',
    marginTop: 100,
  },
});

export default EventDetails;

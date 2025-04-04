// src/screens/events/EventsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { api } from '../../utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ILocation } from '@/src/types/location.type';
import { router } from 'expo-router';

// Types for our events
interface Event {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: ILocation;
  isCreator: boolean;
  attendees: {
    userId: string;
    name: string;
    email: string;
    status: 'accepted' | 'pending' | 'declined';
  }[];
  googleEventId?: string;
  createdAt: string;
}

const EventsScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'created' | 'invited'>('all');
  const { authToken } = useAuth();
  const navigation = useNavigation();

  // Fetch events from your API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('Fetched events:', response.data);

      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // Filter events based on the active tab
  const filteredEvents = () => {
    switch (activeTab) {
      case 'created':
        return events.filter(event => event.isCreator);
      case 'invited':
        return events.filter(event => !event.isCreator);
      default:
        return events;
    }
  };

  const navigateToEventDetails = (eventId: string) => {
    // @ts-ignore - Type navigation will be specific to your app
    navigation.navigate('EventDetails', { eventId });
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    // const startTime = new Date(item.startTime);
    // const endTime = new Date(item.endTime);
    const startTime = new Date();
    const endTime = new Date();

    const formattedDate = format(startTime, 'EEE, MMM d, yyyy');
    const formattedStartTime = format(startTime, 'h:mm a');
    const formattedEndTime = format(endTime, 'h:mm a');

    // Calculate if the event is happening today
    const isToday = new Date().toDateString() === startTime.toDateString();

    // Calculate if the event is in the past
    const isPast = new Date() > endTime;

    return (
      <TouchableOpacity
        style={[
          styles.eventCard,
          isPast ? styles.pastEvent : null,
          isToday ? styles.todayEvent : null,
        ]}
        onPress={() => navigateToEventDetails(item._id)}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          {item.isCreator && (
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorBadgeText}>Creator</Text>
            </View>
          )}
        </View>

        <Text style={styles.eventDate}>{formattedDate}</Text>
        <Text style={styles.eventTime}>
          {formattedStartTime} - {formattedEndTime}
        </Text>

        {item.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.locationText}>{item.location.name}</Text>
          </View>
        )}

        <View style={styles.attendeesContainer}>
          <Text style={styles.attendeesLabel}>Attendees: {item.attendees.length}</Text>
          <Text style={styles.attendeesStatus}>
            {item.attendees.filter(a => a.status === 'accepted').length} accepted
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No events found</Text>
      <Text style={styles.emptySubtext}>No events to display.</Text>

      <TouchableOpacity
        style={styles.createButton}
        // @ts-ignore - Type navigation will be specific to your app
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Text style={styles.createButtonText}>Create a new event</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'created' && styles.activeTab]}
          onPress={() => setActiveTab('created')}
        >
          <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
            Created
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'invited' && styles.activeTab]}
          onPress={() => setActiveTab('invited')}
        >
          <Text style={[styles.tabText, activeTab === 'invited' && styles.activeTabText]}>
            Invited
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents()}
          renderItem={renderEventItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0066cc']} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.floatingButton}
        // @ts-ignore - Type navigation will be specific to your app
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    backgroundColor: 'white',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 8, // Add margin to push tabs down a bit
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066cc',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0066cc',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding for the floating button
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  pastEvent: {
    opacity: 0.7,
    borderLeftColor: '#999',
  },
  todayEvent: {
    borderLeftColor: '#00cc66',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  creatorBadge: {
    backgroundColor: '#e6f2ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  creatorBadgeText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
  },
  eventDate: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  attendeesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendeesLabel: {
    fontSize: 13,
    color: '#666',
  },
  attendeesStatus: {
    fontSize: 13,
    color: '#00cc66',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginTop: 40, // Add more space at the top
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  createButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0066cc',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default EventsScreen;

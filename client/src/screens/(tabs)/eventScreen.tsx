import React, { useState, useEffect, useCallback } from 'react';
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
import { RelativePathString, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { format, isPast, isToday, isFuture, parseISO } from 'date-fns';
import { api } from '../../utils/api';

// Types based on the schema
interface Location {
  address?: string;
  name?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  virtual?: boolean;
  meetingLink?: string;
  metadata?: any;
}

interface EventDate {
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
}

interface Recurrence {
  pattern: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;
  endDate?: string;
  endAfterOccurrences?: number;
  byDaysOfWeek?: number[];
  byDaysOfMonth?: number[];
  excludeDates?: string[];
}

interface Attendee {
  userId?: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  responseTime?: string;
  responseMessage?: string;
}

interface Reminder {
  type: 'email' | 'notification' | 'both';
  time: number; // Minutes before event
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  location?: Location;
  creator: any;
  duration: number;
  eventDates: EventDate[];
  timezone: string;
  recurrence: Recurrence;
  googleCalendarEventId?: string;
  googleCalendarId?: string;
  sync: boolean;
  status: 'scheduled' | 'tentative' | 'confirmed' | 'cancelled';
  attendees: Attendee[];
  visibility: 'public' | 'private' | 'friends';
  reminders: Reminder[];
  createdAt: string;
  updatedAt: string;
}

const EventScreen = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'created' | 'invited'>('all');
  const { authToken, userInfo } = useAuth();
  const router = useRouter();
  console.log('User Info:', userInfo);

  // Fetch events from your API
  const fetchEvents = useCallback(
    async (showLoadingIndicator = true) => {
      try {
        if (showLoadingIndicator) {
          setLoading(true);
        }

        const response = await api.get(`/events`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        console.log('Fetched events:', response.data.events);
        setEvents(response.data.events);
      } catch (error) {
        console.error('Error fetching events:', error);
        if (showLoadingIndicator) {
          Alert.alert('Error', 'Failed to load events. Please try again.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authToken],
  );

  // Initial fetch when component mounts
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Fetch events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('EventScreen focused - refreshing events');
      // Don't show the full-screen loading indicator on focus refresh
      // to provide a better user experience
      fetchEvents(false);

      // Return cleanup function
      return () => {
        // Optional: Any cleanup code here
        console.log('EventScreen blurred');
      };
    }, [fetchEvents]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents(false); // Don't show loading indicator during pull-to-refresh
  };

  // Filter events based on the active tab
  const filteredEvents = () => {
    switch (activeTab) {
      case 'created':
        return events.filter(event => event.creator === userInfo?.id);
      case 'invited':
        return events.filter(event => event.creator !== userInfo?.id);
      default:
        return events;
    }
  };

  // Navigate to event details using expo-router
  const navigateToEventDetails = (eventId: string) => {
    router.push(`/(eventDetails)/${eventId}` as RelativePathString);
  };

  // Navigate to create event screen
  const navigateToCreateEvent = () => {
    router.push('/add-event' as RelativePathString);
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    // Determine if the current user is the creator
    const isCreator = item.creator === userInfo?.id;

    // Count accepted attendees
    const acceptedAttendees = item.attendees.filter(a => a.status === 'accepted').length;

    return (
      <TouchableOpacity
        style={[
          styles.eventCard,
          item.status === 'confirmed' ? styles.confirmedEvent : null,
          item.status === 'cancelled' ? styles.cancelledEvent : null,
        ]}
        onPress={() => navigateToEventDetails(item._id)}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <View style={styles.eventStatusContainer}>
            {isCreator && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorBadgeText}>Creator</Text>
              </View>
            )}
            <View
              style={
                item.status === 'confirmed'
                  ? styles.confirmedBadge
                  : item.status === 'tentative'
                    ? styles.tentativeBadge
                    : item.status === 'cancelled'
                      ? styles.cancelledBadge
                      : styles.scheduledBadge
              }
            >
              <Text
                style={
                  item.status === 'confirmed'
                    ? styles.confirmedBadgeText
                    : item.status === 'tentative'
                      ? styles.tentativeBadgeText
                      : item.status === 'cancelled'
                        ? styles.cancelledBadgeText
                        : styles.scheduledBadgeText
                }
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Display each event date */}
        {item.eventDates.map((eventDate, index) => {
          const startDate = parseISO(eventDate.startDate);
          const endDate = parseISO(eventDate.endDate);

          // Format date
          const formattedDate = format(startDate, 'EEE, MMM d, yyyy');

          // Determine time display (all day or specific time)
          let timeDisplay = 'All day';
          if (!eventDate.isAllDay && eventDate.startTime) {
            const startTime = parseISO(eventDate.startTime);
            const endTime = parseISO(eventDate.endTime || '');
            timeDisplay = `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
          }

          // Calculate if event is today, past, or future
          const eventIsToday = isToday(startDate);
          const eventIsPast = isPast(endDate);

          return (
            <View
              key={index}
              style={[
                styles.dateItem,
                eventIsPast ? styles.pastDateItem : null,
                eventIsToday ? styles.todayDateItem : null,
              ]}
            >
              <View style={styles.dateIconContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={eventIsToday ? '#00cc66' : eventIsPast ? '#999' : '#0066cc'}
                />
              </View>
              <View style={styles.dateTextContainer}>
                <Text style={[styles.eventDate, eventIsPast ? styles.pastEventText : null]}>
                  {formattedDate}
                </Text>
                <Text style={[styles.eventTime, eventIsPast ? styles.pastEventText : null]}>
                  {timeDisplay}
                </Text>
              </View>
            </View>
          );
        })}

        {item.recurrence.pattern !== 'none' && (
          <View style={styles.recurrenceContainer}>
            <Ionicons name="repeat" size={16} color="#666" />
            <Text style={styles.recurrenceText}>
              {item.recurrence.pattern.charAt(0).toUpperCase() + item.recurrence.pattern.slice(1)}
            </Text>
          </View>
        )}

        {item.location && (
          <View style={styles.locationContainer}>
            {item.location.virtual ? (
              <Ionicons name="videocam-outline" size={16} color="#666" />
            ) : (
              <Ionicons name="location-outline" size={16} color="#666" />
            )}
            <Text style={styles.locationText}>
              {item.location.virtual
                ? 'Virtual Meeting'
                : item.location.name || item.location.address || 'Location specified'}
            </Text>
          </View>
        )}

        <View style={styles.attendeesContainer}>
          <Text style={styles.attendeesLabel}>Attendees: {item.attendees.length}</Text>
          <Text style={styles.attendeesStatus}>{acceptedAttendees} accepted</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No events found</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'created'
          ? "You haven't created any events yet."
          : activeTab === 'invited'
            ? "You don't have any invitations."
            : 'No events to display.'}
      </Text>

      <TouchableOpacity style={styles.createButton} onPress={navigateToCreateEvent}>
        <Text style={styles.createButtonText}>Create a new event</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Events</Text>
      </View>

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

      <TouchableOpacity style={styles.floatingButton} onPress={navigateToCreateEvent}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Add these styles to your existing StyleSheet
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todayDateItem: {
    backgroundColor: '#e6f7ee',
    borderRadius: 8,
    borderBottomWidth: 0,
    padding: 6,
    marginBottom: 6,
  },
  pastDateItem: {
    opacity: 0.7,
  },
  dateIconContainer: {
    marginRight: 8,
  },
  dateTextContainer: {
    flex: 1,
  },
  pastEventText: {
    color: '#999',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    backgroundColor: 'white',
    paddingTop: 50, // Increased for status bar
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
  confirmedEvent: {
    borderLeftColor: '#4c6ef5', // Blue for confirmed events
  },
  cancelledEvent: {
    borderLeftColor: '#ff6b6b', // Red for cancelled events
    opacity: 0.7,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  eventStatusContainer: {
    flexDirection: 'row',
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
  scheduledBadge: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  scheduledBadgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  confirmedBadge: {
    backgroundColor: '#e5edff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  confirmedBadgeText: {
    fontSize: 12,
    color: '#4c6ef5',
    fontWeight: '500',
  },
  tentativeBadge: {
    backgroundColor: '#fff8e1',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  tentativeBadgeText: {
    fontSize: 12,
    color: '#ff9500',
    fontWeight: '500',
  },
  cancelledBadge: {
    backgroundColor: '#feeaeb',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  cancelledBadgeText: {
    fontSize: 12,
    color: '#ff6b6b',
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
  recurrenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recurrenceText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
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

export default EventScreen;

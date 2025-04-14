import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { api } from '../../utils/api';
import { set } from 'lodash';

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

const EventDetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { authToken, userInfo } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingCalendar, setSyncingCalendar] = useState(false);

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/events/${id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        setEvent(response.data.event);
      } catch (error) {
        console.error('Error fetching event details:', error);
        Alert.alert('Error', 'Failed to load event details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEventDetails();
    }
  }, [id, authToken]);

  const handleGoBack = () => {
    router.back();
  };

  const handleShare = async () => {
    if (!event) return;

    try {
      const firstDate = event.eventDates[0];
      const startDate = parseISO(firstDate.startDate);

      let shareMessage = `${event.title} on ${format(startDate, 'EEEE, MMMM d, yyyy')}`;

      if (event.location) {
        if (event.location.virtual && event.location.meetingLink) {
          shareMessage += `\nVirtual meeting: ${event.location.meetingLink}`;
        } else if (event.location.name || event.location.address) {
          shareMessage += `\nLocation: ${event.location.name || ''} ${event.location.address || ''}`;
        }
      }

      if (event.description) {
        shareMessage += `\n\n${event.description}`;
      }

      await Share.share({ message: shareMessage });
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const handleAddToCalendar = async () => {
    // In a real implementation, you would integrate with the calendar API
    // Alert.alert('Coming Soon', 'Calendar integration will be available soon!');
    setSyncingCalendar(true);
    try {
      const response = await api.get(`/gemini/events/${id}/suggestions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log('AI suggestions:', response.data.data.suggestedTimes);
      setSyncingCalendar(false);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      Alert.alert('Error', 'Failed to fetch suggestions. Please try again.');
      setSyncingCalendar(false);
    }
  };

  const handleCancelEvent = async () => {
    try {
      const res = await api.delete(`/events/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      router.back();
    } catch (error) {
      console.error('Error canceling event:', error);
      Alert.alert('Error', 'Failed to cancel the event. Please try again.');
    }
  };

  const handleUpdateStatus = (status: 'accepted' | 'declined' | 'tentative') => {
    // In a real implementation, you would call your API to update the attendance status
    Alert.alert('Status Updated', `You have ${status} this event.`);
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

  // Determine if current user is the creator
  const isCreator = event.creator === userInfo?.id;

  // Get current user's attendance status
  const currentUserAttendee = event.attendees.find(
    attendee => attendee.userId === userInfo?.id || attendee.email === userInfo?.email,
  );
  const attendanceStatus = currentUserAttendee?.status || 'pending';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.badgeContainer}>
            {isCreator && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorBadgeText}>Creator</Text>
              </View>
            )}
            <View
              style={
                event.status === 'confirmed'
                  ? styles.confirmedBadge
                  : event.status === 'tentative'
                    ? styles.tentativeBadge
                    : event.status === 'cancelled'
                      ? styles.cancelledBadge
                      : styles.scheduledBadge
              }
            >
              <Text
                style={
                  event.status === 'confirmed'
                    ? styles.confirmedBadgeText
                    : event.status === 'tentative'
                      ? styles.tentativeBadgeText
                      : event.status === 'cancelled'
                        ? styles.cancelledBadgeText
                        : styles.scheduledBadgeText
                }
              >
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Date & Time</Text>

          {event.eventDates.map((date, index) => {
            const startDate = parseISO(date.startDate);
            const endDate = parseISO(date.endDate);
            const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');

            // Time display
            let timeDisplay = 'All day';
            if (!date.isAllDay && date.startTime) {
              const startTime = parseISO(date.startTime);
              const endTime = parseISO(date.endTime || '');
              timeDisplay = `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
            }

            const eventIsToday = isToday(startDate);
            const eventIsPast = isPast(endDate);

            return (
              <View
                key={index}
                style={[
                  styles.dateItem,
                  eventIsToday ? styles.todayDateItem : null,
                  eventIsPast ? styles.pastDateItem : null,
                ]}
              >
                <View style={styles.detailRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={eventIsToday ? '#00cc99' : eventIsPast ? '#999' : '#00cc99'}
                  />
                  <Text style={[styles.detailText, eventIsPast ? styles.pastText : null]}>
                    {formattedDate}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={eventIsToday ? '#00cc99' : eventIsPast ? '#999' : '#00cc99'}
                  />
                  <Text style={[styles.detailText, eventIsPast ? styles.pastText : null]}>
                    {timeDisplay}
                  </Text>
                </View>
              </View>
            );
          })}

          {event.recurrence.pattern !== 'none' && (
            <View style={styles.detailRow}>
              <Ionicons name="repeat" size={20} color="#00cc99" />
              <Text style={styles.detailText}>
                Repeats {event.recurrence.pattern}
                {event.recurrence.interval && event.recurrence.interval > 1
                  ? ` every ${event.recurrence.interval} ${event.recurrence.pattern}s`
                  : ''}
              </Text>
            </View>
          )}

          {event.location && (
            <View style={styles.detailRow}>
              {event.location.virtual ? (
                <>
                  <Ionicons name="videocam-outline" size={20} color="#00cc99" />
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.detailText}>Virtual Meeting</Text>
                    {event.location.meetingLink && (
                      <Text style={styles.linkText}>{event.location.meetingLink}</Text>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="location-outline" size={20} color="#00cc99" />
                  <View style={styles.locationTextContainer}>
                    {event.location.name && (
                      <Text style={styles.detailText}>{event.location.name}</Text>
                    )}
                    {event.location.address && (
                      <Text style={styles.detailAddressText}>{event.location.address}</Text>
                    )}
                  </View>
                </>
              )}
            </View>
          )}

          {/* Show timezone */}
          <View style={styles.detailRow}>
            <Ionicons name="globe-outline" size={20} color="#00cc99" />
            <Text style={styles.detailText}>{event.timezone}</Text>
          </View>
        </View>

        {event.description && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Attendees ({event.attendees.length})</Text>

          {!isCreator && attendanceStatus === 'pending' && (
            <View style={styles.responseContainer}>
              <Text style={styles.responsePrompt}>Respond to this invitation:</Text>
              <View style={styles.responseButtons}>
                <TouchableOpacity
                  style={[styles.responseButton, styles.acceptButton]}
                  onPress={() => handleUpdateStatus('accepted')}
                >
                  <Text style={styles.responseButtonText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.responseButton, styles.tentativeButton]}
                  onPress={() => handleUpdateStatus('tentative')}
                >
                  <Text style={styles.responseButtonText}>Maybe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.responseButton, styles.declineButton]}
                  onPress={() => handleUpdateStatus('declined')}
                >
                  <Text style={styles.responseButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {event.attendees.map((attendee, index) => (
            <View key={index} style={styles.attendeeRow}>
              <View style={styles.attendeeInfo}>
                <Text style={styles.attendeeName}>{attendee.name}</Text>
                <Text style={styles.attendeeEmail}>{attendee.email}</Text>
                {attendee.userId === event.creator && (
                  <View style={styles.organizerBadge}>
                    <Text style={styles.organizerText}>Organizer</Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.statusBadge,
                  attendee.status === 'accepted'
                    ? styles.acceptedStatusBadge
                    : attendee.status === 'tentative'
                      ? styles.tentativeStatusBadge
                      : attendee.status === 'declined'
                        ? styles.declinedStatusBadge
                        : styles.pendingStatusBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    attendee.status === 'accepted'
                      ? styles.acceptedStatusText
                      : attendee.status === 'tentative'
                        ? styles.tentativeStatusText
                        : attendee.status === 'declined'
                          ? styles.declinedStatusText
                          : styles.pendingStatusText,
                  ]}
                >
                  {attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {event.reminders && event.reminders.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Reminders</Text>
            {event.reminders.map((reminder, index) => (
              <View key={index} style={styles.reminderRow}>
                <Ionicons name="notifications-outline" size={20} color="#00cc99" />
                <Text style={styles.reminderText}>
                  {reminder.time === 0 ? 'At time of event' : `${reminder.time} minutes before`}
                  {' via '}
                  {reminder.type === 'both' ? 'email and notification' : reminder.type}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, event.sync ? styles.syncedButton : null]}
            onPress={handleAddToCalendar}
            disabled={syncingCalendar}
          >
            {syncingCalendar ? (
              <View style={styles.syncLoadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.buttonText}>Syncing...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="calendar" size={20} color="#fff" />
                <Text style={styles.buttonText}>
                  {event.sync ? 'Synced to Calendar' : 'Sync to Calendar'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {event.status !== 'cancelled' && !isCreator && (
            <TouchableOpacity
              style={[
                styles.button,
                attendanceStatus === 'accepted'
                  ? styles.acceptedButton
                  : attendanceStatus === 'tentative'
                    ? styles.tentativeButton
                    : attendanceStatus === 'declined'
                      ? styles.declinedButton
                      : styles.pendingButton,
              ]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>
                {attendanceStatus === 'accepted'
                  ? 'Accepted'
                  : attendanceStatus === 'tentative'
                    ? 'Maybe'
                    : attendanceStatus === 'declined'
                      ? 'Declined'
                      : 'Pending'}
              </Text>
            </TouchableOpacity>
          )}

          {isCreator && event.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#ff6b6b' }]}
              onPress={handleCancelEvent}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Cancel Event</Text>
            </TouchableOpacity>
          )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
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
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorBadge: {
    backgroundColor: '#e6f2ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
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
  },
  cancelledBadgeText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: '500',
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
  },
  dateItem: {
    padding: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  todayDateItem: {
    backgroundColor: '#e6f7ee',
    borderRadius: 8,
  },
  pastDateItem: {
    opacity: 0.7,
  },
  pastText: {
    color: '#999',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  detailAddressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  linkText: {
    fontSize: 14,
    color: '#0066cc',
    marginTop: 2,
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
  responseContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  responsePrompt: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  responseButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  responseButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#00cc99',
  },
  tentativeButton: {
    backgroundColor: '#ff9500',
  },
  declineButton: {
    backgroundColor: '#ff6b6b',
  },
  responseButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  attendeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  attendeeEmail: {
    fontSize: 14,
    color: '#666',
  },
  organizerBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  organizerText: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  acceptedStatusBadge: {
    backgroundColor: '#e6f7ee',
  },
  tentativeStatusBadge: {
    backgroundColor: '#fff8e1',
  },
  declinedStatusBadge: {
    backgroundColor: '#feeaeb',
  },
  pendingStatusBadge: {
    backgroundColor: '#f0f0f0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  acceptedStatusText: {
    color: '#00cc99',
  },
  tentativeStatusText: {
    color: '#ff9500',
  },
  declinedStatusText: {
    color: '#ff6b6b',
  },
  pendingStatusText: {
    color: '#666',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  reminderText: {
    fontSize: 16,
    color: '#444',
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
  syncedButton: {
    backgroundColor: '#4c6ef5',
  },
  acceptedButton: {
    backgroundColor: '#00cc99',
  },
  declinedButton: {
    backgroundColor: '#ff6b6b',
  },
  pendingButton: {
    backgroundColor: '#666',
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
  syncLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});

export default EventDetails;

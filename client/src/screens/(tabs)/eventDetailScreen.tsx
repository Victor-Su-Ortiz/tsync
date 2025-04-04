// src/screens/events/EventDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import axios from 'axios';
import { EXPO_PUBLIC_API_URL } from '@env';

// Define types
type EventDetailsRouteParams = {
  eventId: string;
};

type EventDetailsRouteProp = RouteProp<{ EventDetails: EventDetailsRouteParams }, 'EventDetails'>;

interface Attendee {
  _id: string;
  userId: string;
  name: string;
  email: string;
  status: 'accepted' | 'pending' | 'declined';
  profilePicture?: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
  isCreator: boolean;
  attendees: Attendee[];
  googleEventId?: string;
  googleCalendarId?: string;
  createdAt: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
}

const EventDetailsScreen = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userResponseStatus, setUserResponseStatus] = useState<
    'accepted' | 'pending' | 'declined' | null
  >(null);
  const { authToken, userInfo } = useAuth();
  const route = useRoute<EventDetailsRouteProp>();
  const navigation = useNavigation();
  const { eventId } = route.params;

  // Fetch event details
  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}/api/v1/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setEvent(response.data.event);

      // Find current user's response status
      if (userInfo?.id && response.data.event.attendees) {
        const userAttendee = response.data.event.attendees.find(
          (attendee: Attendee) => attendee.userId === userInfo.id,
        );
        if (userAttendee) {
          setUserResponseStatus(userAttendee.status);
        }
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      Alert.alert('Error', 'Failed to load event details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  // Update attendance status
  const updateAttendanceStatus = async (status: 'accepted' | 'declined') => {
    if (!event) return;

    try {
      setUpdating(true);
      await axios.post(
        `${EXPO_PUBLIC_API_URL}/api/v1/events/${eventId}/respond`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      setUserResponseStatus(status);
      // Refresh event details to get updated attendee list
      fetchEventDetails();

      Alert.alert('Success', `You have ${status} the event invitation.`);
    } catch (error) {
      console.error('Error updating attendance status:', error);
      Alert.alert('Error', 'Failed to update your response. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Delete event
  const deleteEvent = async () => {
    if (!event) return;

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
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
              setUpdating(true);
              await axios.delete(`${EXPO_PUBLIC_API_URL}/api/v1/events/${eventId}`, {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              });

              Alert.alert('Success', 'Event has been deleted.');
              // @ts-ignore
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete the event. Please try again.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
    );
  };

  // Open in Google Calendar
  const openInGoogleCalendar = () => {
    if (!event?.googleEventId || !event?.googleCalendarId) {
      Alert.alert('Info', 'Google Calendar link not available for this event.');
      return;
    }

    const url = `https://calendar.google.com/calendar/event?eid=${event.googleEventId}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open the Google Calendar link.');
        }
      })
      .catch(error => {
        console.error('Error opening Google Calendar link:', error);
        Alert.alert('Error', 'Failed to open the Google Calendar link.');
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color="#ff3b30" />
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          // @ts-ignore
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);

  const formattedDate = format(startDate, 'EEEE, MMMM d, yyyy');
  const formattedStartTime = format(startDate, 'h:mm a');
  const formattedEndTime = format(endDate, 'h:mm a');

  // Check if the event is in the past
  const isPastEvent = new Date() > endDate;

  return (
    <ScrollView style={styles.container}>
      {/* Event Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.headerActions}>
          {event.isCreator && (
            <TouchableOpacity
              style={styles.iconButton}
              // @ts-ignore
              onPress={() => navigation.navigate('EditEvent', { eventId: event._id })}
            >
              <Ionicons name="pencil" size={20} color="#0066cc" />
            </TouchableOpacity>
          )}

          {event.googleEventId && (
            <TouchableOpacity style={styles.iconButton} onPress={openInGoogleCalendar}>
              <Ionicons name="calendar" size={20} color="#0066cc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Event Details */}
      <View style={styles.card}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={22} color="#666" style={styles.detailIcon} />
          <View>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailText}>{formattedDate}</Text>
            <Text style={styles.detailText}>
              {formattedStartTime} - {formattedEndTime}
            </Text>
          </View>
        </View>

        {event.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={22} color="#666" style={styles.detailIcon} />
            <View>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailText}>{event.location}</Text>
            </View>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={22} color="#666" style={styles.detailIcon} />
          <View>
            <Text style={styles.detailLabel}>Organizer</Text>
            <Text style={styles.detailText}>{event.createdBy.name}</Text>
          </View>
        </View>

        {event.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}
      </View>

      {/* Attendees Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Attendees ({event.attendees.length})</Text>
      </View>

      <View style={styles.attendeesCard}>
        {event.attendees.map(attendee => (
          <View key={attendee._id} style={styles.attendeeRow}>
            <View style={styles.attendeeInfo}>
              {/* Avatar placeholder - replace with actual avatar component if you have one */}
              <View style={styles.attendeeAvatar}>
                <Text style={styles.attendeeInitial}>{attendee.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.attendeeName}>{attendee.name}</Text>
                <Text style={styles.attendeeEmail}>{attendee.email}</Text>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                attendee.status === 'accepted'
                  ? styles.acceptedBadge
                  : attendee.status === 'declined'
                    ? styles.declinedBadge
                    : styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  attendee.status === 'accepted'
                    ? styles.acceptedText
                    : attendee.status === 'declined'
                      ? styles.declinedText
                      : styles.pendingText,
                ]}
              >
                {attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      {!event.isCreator && !isPastEvent && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.responseButton,
              userResponseStatus === 'accepted' ? styles.acceptedButton : styles.acceptButton,
            ]}
            onPress={() => updateAttendanceStatus('accepted')}
            disabled={updating || userResponseStatus === 'accepted'}
          >
            {updating && userResponseStatus !== 'accepted' ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons
                  name={
                    userResponseStatus === 'accepted'
                      ? 'checkmark-circle'
                      : 'checkmark-circle-outline'
                  }
                  size={20}
                  color="white"
                  style={styles.buttonIcon}
                />
                <Text style={styles.responseButtonText}>
                  {userResponseStatus === 'accepted' ? 'Accepted' : 'Accept'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.responseButton,
              userResponseStatus === 'declined' ? styles.declinedButton : styles.declineButton,
            ]}
            onPress={() => updateAttendanceStatus('declined')}
            disabled={updating || userResponseStatus === 'declined'}
          >
            {updating && userResponseStatus !== 'declined' ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons
                  name={userResponseStatus === 'declined' ? 'close-circle' : 'close-circle-outline'}
                  size={20}
                  color="white"
                  style={styles.buttonIcon}
                />
                <Text style={styles.responseButtonText}>
                  {userResponseStatus === 'declined' ? 'Declined' : 'Decline'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Event Button (for creator only) */}
      {event.isCreator && (
        <TouchableOpacity style={styles.deleteButton} onPress={deleteEvent} disabled={updating}>
          {updating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.deleteButtonText}>Delete Event</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Bottom Padding */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  descriptionLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  attendeesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  attendeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  attendeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  attendeeInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  attendeeEmail: {
    fontSize: 14,
    color: '#888',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acceptedBadge: {
    backgroundColor: '#e6f7ee',
  },
  declinedBadge: {
    backgroundColor: '#ffebee',
  },
  pendingBadge: {
    backgroundColor: '#fff8e1',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  acceptedText: {
    color: '#00cc66',
  },
  declinedText: {
    color: '#ff3b30',
  },
  pendingText: {
    color: '#ff9500',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
  },
  acceptButton: {
    backgroundColor: '#00cc66',
  },
  acceptedButton: {
    backgroundColor: '#00cc66',
    opacity: 0.8,
  },
  declineButton: {
    backgroundColor: '#ff3b30',
  },
  declinedButton: {
    backgroundColor: '#ff3b30',
    opacity: 0.8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  responseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3b30',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 24,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
export default EventDetailsScreen;

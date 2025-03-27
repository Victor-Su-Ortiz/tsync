import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import moment from 'moment';
import { useAuth } from '../../context/AuthContext';

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  description?: string;
}

export default function Events() {
  const { accessToken, idToken, authToken } = useAuth();
  const [selectedDay, setSelectedDay] = useState(moment().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);

  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarEvent[]>>({});

  // In your fetchAllEvents function, modify how events are stored:
  const fetchAllEvents = async (calendarId = 'primary', pageToken: string | null = null) => {
    try {
      let url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?singleEvents=true&orderBy=startTime`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await axios.get<{ items: CalendarEvent[]; nextPageToken?: string }>(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const newEvents = response.data.items || [];

      // Organize events by date
      setEventsByDate(prevEvents => {
        const updatedEvents = { ...prevEvents };

        newEvents.forEach(event => {
          // Get the date from either dateTime or date field
          const eventDate = event.start.dateTime
            ? moment(event.start.dateTime).format('YYYY-MM-DD')
            : event.start.date;

          if (eventDate) {
            if (!updatedEvents[eventDate]) {
              updatedEvents[eventDate] = [];
            }
            updatedEvents[eventDate].push(event);
          }
        });

        return updatedEvents;
      });

      const nextPageToken: string | undefined = response.data.nextPageToken;

      if (typeof nextPageToken === 'string') {
        await fetchAllEvents(calendarId, nextPageToken);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    console.log(authToken);

    if (accessToken) {
      fetchAllEvents(); // ✅ Fetch events after token is set
    }
  }, [accessToken]);

  // Generate days around the current week
  const generateDays = () => {
    const days = [];
    for (let i = -30; i <= 30; i++) {
      days.push(moment().add(i, 'days').format('YYYY-MM-DD'));
    }
    return days;
  };

  const renderDay = ({ item }: { item: string }) => {
    const isSelected = item === selectedDay;
    const hasEvents = eventsByDate[item]?.length > 0;

    return (
      <TouchableOpacity
        style={[styles.dayButton, isSelected && styles.selectedDayButton]}
        onPress={() => setSelectedDay(item)}
      >
        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
          {moment(item).format('ddd')}
        </Text>
        <Text style={[styles.dateText, isSelected && styles.selectedDayText]}>
          {moment(item).format('D')}
        </Text>
        {hasEvents && <View style={styles.eventDot} />}
      </TouchableOpacity>
    );
  };

  const renderEventsForSelectedDay = () => {
    const dayEvents = eventsByDate[selectedDay] || [];

    return (
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsHeader}>
          Events for {moment(selectedDay).format('dddd, MMM D')}
        </Text>

        {dayEvents.length > 0 ? (
          dayEvents.map((event, index) => (
            <View key={event.id || index} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.summary}</Text>
              <Text style={styles.eventTime}>
                {event.start.dateTime
                  ? `${moment(event.start.dateTime).format('h:mm A')} - ${moment(event.end.dateTime).format('h:mm A')}`
                  : 'All day'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noEventText}>No events for this day.</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <>
          <FlatList
            horizontal
            data={generateDays()}
            keyExtractor={item => item}
            renderItem={renderDay}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekDaysContainer}
          />
          {renderEventsForSelectedDay()}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0,
    marginTop: StatusBar.currentHeight,
    backgroundColor: '#f9f9f9',
  },
  weekDaysContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  dayButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 5,
    backgroundColor: '#e0f7fa',
    width: 70,
  },
  selectedDayButton: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#555',
  },
  selectedDayText: {
    color: '#fff',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF5733',
    marginTop: 3,
  },
  eventsContainer: {
    marginTop: 20,
    padding: 10,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  eventsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  eventCard: {
    backgroundColor: '#e0f7fa',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  eventTime: {
    fontSize: 12,
    color: '#555',
  },
  noEventText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  signInButton: {
    backgroundColor: '#4285F4',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
    width: 200,
  },
  eventDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

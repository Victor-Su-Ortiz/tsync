import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'react-native-calendars';

export type DateTimeRange = {
  id: string;
  startDate: Date;
  endDate: Date;
  startTime: Date;
  endTime: Date;
};

type DateTimePickerModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (selectedRanges: DateTimeRange[]) => void;
  existingRanges: DateTimeRange[];
  title: string;
};

// Format date for display (compact version for pills)
const formatShortDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const DateTimePickerModal = ({
  isVisible,
  onClose,
  onConfirm,
  existingRanges,
  title
}: DateTimePickerModalProps) => {
  // State to manage all date/time ranges
  const [ranges, setRanges] = useState<DateTimeRange[]>(existingRanges);

  // State for picker modes
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMode, setCurrentMode] = useState<'startDate' | 'endDate' | 'startTime' | 'endTime'>('startDate');

  // Initialize new range with default values
  const initializeNewRange = () => {
    const now = new Date();
    const later = new Date(now);
    later.setHours(now.getHours() + 1); // Default end time is 1 hour later

    return {
      id: Date.now().toString(),
      startDate: now,
      endDate: now,
      startTime: now,
      endTime: later
    };
  };

  // Function to check if a date is in the past (for validation)
  const isDateInPast = (dateToCheck: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates

    const checkDate = new Date(dateToCheck);
    checkDate.setHours(0, 0, 0, 0); // Reset time to compare only dates

    return checkDate < today;
  };

  // Check if a new date range is an exact duplicate of an existing range
  const isExactDuplicate = (newStartDate: Date, newEndDate: Date, newStartTime: Date, newEndTime: Date): boolean => {
    return ranges.some(range => {
      // Check if dates match (day, month, year)
      const sameStartDate = range.startDate.getDate() === newStartDate.getDate() &&
        range.startDate.getMonth() === newStartDate.getMonth() &&
        range.startDate.getFullYear() === newStartDate.getFullYear();

      const sameEndDate = range.endDate.getDate() === newEndDate.getDate() &&
        range.endDate.getMonth() === newEndDate.getMonth() &&
        range.endDate.getFullYear() === newEndDate.getFullYear();

      // Check if times match (hours and minutes)
      const sameStartTime = range.startTime.getHours() === newStartTime.getHours() &&
        range.startTime.getMinutes() === newStartTime.getMinutes();

      const sameEndTime = range.endTime.getHours() === newEndTime.getHours() &&
        range.endTime.getMinutes() === newEndTime.getMinutes();

      // Return true if all components match
      return sameStartDate && sameEndDate && sameStartTime && sameEndTime;
    });
  };

  const [newRange, setNewRange] = useState<Partial<DateTimeRange>>(initializeNewRange());

  // Reset ranges when modal is opened
  useEffect(() => {
    if (isVisible) {
      setRanges(existingRanges);
    }
  }, [isVisible, existingRanges]);

  // Handle time picker changes
  const handleTimeChange = (event: any, selectedValue?: Date) => {
    if (!selectedValue) return;

    // Update the current field based on mode
    setNewRange(prev => {
      const updated = { ...prev };

      // For time fields
      const updateTimeOnly = (date: Date | undefined, newTime: Date) => {
        if (!date) return newTime;

        const result = new Date(date);
        result.setHours(newTime.getHours(), newTime.getMinutes());
        return result;
      };

      if (currentMode === 'startTime') {
        updated.startTime = updateTimeOnly(prev.startTime, selectedValue);

        // If same day and end time is before new start time, update end time
        if (prev.startDate?.toDateString() === prev.endDate?.toDateString() &&
          prev.endTime && selectedValue > prev.endTime) {
          const endTime = new Date(selectedValue);
          endTime.setMinutes(endTime.getMinutes() + 30); // Default to 30 minutes later
          updated.endTime = endTime;
        }
      } else if (currentMode === 'endTime') {
        updated.endTime = updateTimeOnly(prev.endTime, selectedValue);
      }

      return updated;
    });
  };

  // Handle date selection from calendar
  const handleDateSelect = (day: { dateString: string, timestamp: number }) => {
    // Create a date using the dateString (YYYY-MM-DD) to avoid timezone issues
    const dateParts = day.dateString.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed in JS Date
    const date = parseInt(dateParts[2]);

    const selectedDate = new Date(year, month, date);

    // Check if selected date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates

    if (selectedDate < today) {
      Alert.alert('Invalid Date', 'You cannot select a date in the past.');
      return;
    }

    setNewRange(prev => {
      const updated = { ...prev };

      // Preserve time from existing dates when changing date
      const updateDate = (existingDate: Date | undefined, newDate: Date) => {
        if (!existingDate) return newDate;

        const result = new Date(newDate);
        result.setHours(existingDate.getHours(), existingDate.getMinutes());
        return result;
      };

      if (currentMode === 'startDate') {
        updated.startDate = updateDate(prev.startDate, selectedDate);

        // If end date exists and is now before the new start date, update end date to match start date
        if (prev.endDate && selectedDate > prev.endDate) {
          updated.endDate = new Date(selectedDate);
          if (prev.endDate) {
            // Preserve end time
            updated.endDate.setHours(prev.endDate.getHours(), prev.endDate.getMinutes());
          }
        }
      } else if (currentMode === 'endDate') {
        updated.endDate = updateDate(prev.endDate, selectedDate);

        // If end date is before start date, update start date to match end date
        if (selectedDate < prev.startDate!) {
          updated.startDate = new Date(selectedDate);
          if (prev.startDate) {
            // Preserve start time
            updated.startDate.setHours(prev.startDate.getHours(), prev.startDate.getMinutes());
          }
        }
      }

      return updated;
    });

    // Hide calendar after selection
    setShowCalendar(false);
  };

  const addNewRange = () => {
    // Validate the new range
    if (!newRange.startDate || !newRange.endDate || !newRange.startTime || !newRange.endTime) {
      Alert.alert('Incomplete Range', 'Please fill in all date and time fields.');
      return;
    }

    // Check if start date is in the past
    if (isDateInPast(newRange.startDate!)) {
      Alert.alert('Invalid Date', 'You cannot create an event that starts in the past.');
      return;
    }

    // Check if end date is in the past
    if (isDateInPast(newRange.endDate!)) {
      Alert.alert('Invalid Date', 'You cannot create an event that ends in the past.');
      return;
    }

    // Create date objects with combined date and time for validation
    const startDateTime = new Date(newRange.startDate!);
    startDateTime.setHours(
      newRange.startTime!.getHours(),
      newRange.startTime!.getMinutes()
    );

    const endDateTime = new Date(newRange.endDate!);
    endDateTime.setHours(
      newRange.endTime!.getHours(),
      newRange.endTime!.getMinutes()
    );

    // Validate that end date is not before start date
    if (newRange.endDate! < newRange.startDate!) {
      Alert.alert('Invalid Date Range', 'End date cannot be before start date.');
      return;
    }

    // Validate that end is after start (if same day)
    if (newRange.startDate!.toDateString() === newRange.endDate!.toDateString() &&
      endDateTime < startDateTime) {
      Alert.alert('Invalid Time Range', 'End time must be after start time on the same day.');
      return;
    }

    // Check for exact duplicates of existing ranges
    if (isExactDuplicate(newRange.startDate!, newRange.endDate!, newRange.startTime!, newRange.endTime!)) {
      Alert.alert('Duplicate Schedule', 'This exact date and time range already exists. Please select a different time range.');
      return;
    }

    // Add the new range
    const completeRange = {
      id: newRange.id || Date.now().toString(),
      startDate: newRange.startDate!,
      endDate: newRange.endDate!,
      startTime: newRange.startTime!,
      endTime: newRange.endTime!,
    };

    setRanges([...ranges, completeRange]);

    // Reset for the next range
    setNewRange(initializeNewRange());
    setCurrentMode('startDate');
    setShowCalendar(false);
  };

  const handleDeleteRange = (id: string) => {
    setRanges(ranges.filter(range => range.id !== id));
  };

  const handleConfirm = () => {
    onConfirm(ranges);
    onClose();
  };

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time?: Date) => {
    if (!time) return '';
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCurrentValue = () => {
    switch (currentMode) {
      case 'startTime': return newRange.startTime || new Date();
      case 'endTime': return newRange.endTime || new Date();
      default: return new Date();
    }
  };

  // Get marked dates for the calendar
  const getMarkedDates = () => {
    const markedDates: any = {};

    // Mark past dates as disabled
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mark current selected date
    if (currentMode === 'startDate' && newRange.startDate) {
      const dateStr = newRange.startDate.toISOString().split('T')[0];
      markedDates[dateStr] = { selected: true, selectedColor: '#00cc99' };
    } else if (currentMode === 'endDate' && newRange.endDate) {
      const dateStr = newRange.endDate.toISOString().split('T')[0];
      markedDates[dateStr] = { selected: true, selectedColor: '#00cc99' };
    }

    return markedDates;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollViewContent}
          >
            {/* List of existing date ranges - in horizontal row */}
            {ranges.length > 0 && (
              <View style={styles.rangesContainer}>
                <Text style={styles.rangesTitle}>Scheduled Dates:</Text>
                <ScrollView
                  horizontal={true}
                  showsHorizontalScrollIndicator={true}
                  style={styles.rangesList}
                  contentContainerStyle={styles.rangesListContent}
                >
                  {ranges.map((range) => (
                    <View key={range.id} style={styles.rangeCard}>
                      <View style={styles.rangeContentContainer}>
                        <Text style={styles.rangeDate}>
                          {formatShortDate(range.startDate)}
                          {range.startDate.toDateString() !== range.endDate.toDateString() ?
                            ` - ${formatShortDate(range.endDate)}` : ''}
                        </Text>
                        <Text style={styles.rangeTime}>
                          {formatTime(range.startTime)} - {formatTime(range.endTime)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteRange(range.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="close-circle" size={18} color="#ff3b30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* New range selector */}
            <View style={styles.newRangeContainer}>
              <Text style={styles.newRangeTitle}>Add Date Range:</Text>

              {/* Date Selection Rows */}
              <View style={styles.dateTimeSelectionContainer}>
                {/* All dates in one row */}
                <View style={styles.datesRow}>
                  <TouchableOpacity
                    style={[styles.dateButton, currentMode === 'startDate' && styles.activeSelection]}
                    onPress={() => {
                      setCurrentMode('startDate');
                      setShowCalendar(true);
                    }}
                  >
                    <Text style={styles.dateTimeLabel}>Start Date</Text>
                    <Text style={styles.dateTimeValue}>{formatDate(newRange.startDate)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.dateButton, currentMode === 'endDate' && styles.activeSelection]}
                    onPress={() => {
                      setCurrentMode('endDate');
                      setShowCalendar(true);
                    }}
                  >
                    <Text style={styles.dateTimeLabel}>End Date</Text>
                    <Text style={styles.dateTimeValue}>{formatDate(newRange.endDate)}</Text>
                  </TouchableOpacity>
                </View>

                {/* All times in one row */}
                <View style={styles.timesRow}>
                  <TouchableOpacity
                    style={[styles.timeButton, currentMode === 'startTime' && styles.activeSelection]}
                    onPress={() => {
                      setCurrentMode('startTime');
                      setShowCalendar(false);
                    }}
                  >
                    <Text style={styles.dateTimeLabel}>Start Time</Text>
                    <Text style={styles.dateTimeValue}>{formatTime(newRange.startTime)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.timeButton, currentMode === 'endTime' && styles.activeSelection]}
                    onPress={() => {
                      setCurrentMode('endTime');
                      setShowCalendar(false);
                    }}
                  >
                    <Text style={styles.dateTimeLabel}>End Time</Text>
                    <Text style={styles.dateTimeValue}>{formatTime(newRange.endTime)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Calendar (only show when selecting dates) */}
              {showCalendar && (
                <View style={styles.calendarContainer}>
                  <Calendar
                    onDayPress={handleDateSelect}
                    markedDates={getMarkedDates()}
                    initialDate={
                      currentMode === 'startDate'
                        ? newRange.startDate?.toISOString().split('T')[0]
                        : newRange.endDate?.toISOString().split('T')[0]
                    }
                    minDate={new Date().toISOString().split('T')[0]} // Disable past dates
                    theme={{
                      todayTextColor: '#00cc99',
                      arrowColor: '#00cc99',
                      dotColor: '#00cc99',
                      selectedDayBackgroundColor: '#00cc99',
                      disabledTextColor: '#d9e1e8', // Style for disabled dates
                    }}
                  />
                </View>
              )}

              {/* Time Picker (only show when selecting times) */}
              {!showCalendar && (currentMode === 'startTime' || currentMode === 'endTime') && (
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={getCurrentValue()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                    style={styles.timePicker}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.addRangeButton}
                onPress={addNewRange}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.addRangeText}>Add This Date Range</Text>
              </TouchableOpacity>

              {/* Add some bottom padding to ensure scrolling works well */}
              <View style={styles.bottomPadding} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    height: '90%', // Set a fixed height to ensure proper scrolling
  },
  modalScrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  bottomPadding: {
    height: 30, // Add some bottom padding for better scrolling
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  confirmButton: {
    padding: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  confirmText: {
    fontSize: 16,
    color: '#00cc99',
    fontWeight: 'bold',
  },
  rangesContainer: {
    padding: 15,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  rangesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rangesList: {
    maxHeight: 70,
  },
  rangesListContent: {
    paddingRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap', // Prevent wrapping to ensure horizontal scrolling
  },
  rangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 120, // Ensure a minimum width for pills
    maxWidth: 240, // Limit maximum width of pill
    alignSelf: 'flex-start', // Prevent horizontal stretching
  },
  rangeContentContainer: {
    flexDirection: 'column',
    marginRight: 8, // Ensure space between content and delete button
    flexShrink: 1, // Allow content to shrink if needed
  },
  rangeDate: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  rangeTime: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 2,
  },
  newRangeContainer: {
    padding: 15,
  },
  newRangeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateTimeSelectionContainer: {
    marginBottom: 15,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#fafafa',
  },
  timeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#fafafa',
  },
  activeSelection: {
    borderColor: '#00cc99',
    backgroundColor: '#e6fff9',
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateTimeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarContainer: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 15,
  },
  timePickerContainer: {
    marginBottom: 15,
  },
  timePicker: {
    width: '100%',
    height: 180,
  },
  addRangeButton: {
    flexDirection: 'row',
    backgroundColor: '#00cc99',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRangeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default DateTimePickerModal;
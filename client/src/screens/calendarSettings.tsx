import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalendar } from '../hooks/useCalendar';

export default function CalendarSettingsScreen() {
  const {
    isCalendarConnected,
    isCalendarSyncEnabled,
    calendarLoading,
    toggleCalendarSync,
    disconnectCalendar,
    connectCalendar,
  } = useCalendar();
  const [isTogglingSync, setIsTogglingSync] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const router = useRouter();

  const handleToggleSync = async (value: boolean) => {
    setIsTogglingSync(true);
    await toggleCalendarSync(value);
    setIsTogglingSync(false);
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Calendar',
      'Are you sure you want to disconnect your Google Calendar? This will affect meeting scheduling functionality.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: async () => {
            setIsDisconnecting(true);
            await disconnectCalendar();
            setIsDisconnecting(false);
          }
        }
      ]
    );
  };

  if (calendarLoading || isTogglingSync || isDisconnecting) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>
          {isTogglingSync 
            ? 'Updating sync settings...' 
            : isDisconnecting 
              ? 'Disconnecting calendar...' 
              : 'Loading calendar settings...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Calendar Settings</Text>
        
        {isCalendarConnected ? (
          <>
            <View style={styles.connectedContainer}>
              <Text style={styles.connectedText}>
                ✓ Your Google Calendar is connected
              </Text>
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingText}>Sync calendar events</Text>
              <Switch
                value={isCalendarSyncEnabled}
                onValueChange={handleToggleSync}
                trackColor={{ false: "#ddd", true: "#4caf50" }}
                thumbColor={isCalendarSyncEnabled ? "#fff" : "#f4f3f4"}
              />
            </View>
            
            <Text style={styles.infoText}>
              When enabled, your meetings will automatically be added to your Google Calendar.
            </Text>
            
            <TouchableOpacity
              onPress={handleDisconnect}
              style={styles.disconnectButton}
            >
              <Text style={styles.disconnectButtonText}>Disconnect Calendar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.notConnectedContainer}>
              <Text style={styles.notConnectedText}>
                Your Google Calendar is not connected
              </Text>
            </View>
            
            <Text style={styles.infoText}>
              Connect your Google Calendar to schedule meetings seamlessly and never miss an important event.
            </Text>
            
            <TouchableOpacity
              onPress={() => connectCalendar('./calendarSettings')}
              style={styles.connectButton}
            >
              <Text style={styles.buttonText}>Connect Google Calendar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight,
    backgroundColor: '#f9f9f9',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  connectedContainer: {
    backgroundColor: '#e6f7ed',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  connectedText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '500',
  },
  notConnectedContainer: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  notConnectedText: {
    color: '#e65100',
    fontSize: 16,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 30,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  disconnectButton: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  disconnectButtonText: {
    color: '#d32f2f',
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center',
  },
});
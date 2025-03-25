// client/src/screens/calendar/CalendarSettingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, Switch, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCalendar } from '../hooks/useCalendar';

const CalendarSettingsScreen = () => {
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
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-5 text-gray-600 text-base">
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
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-5 pt-4">
        <Text className="text-2xl font-bold mb-8">Calendar Settings</Text>
        
        {isCalendarConnected ? (
          <>
            <View className="bg-green-50 p-4 rounded-xl mb-6">
              <Text className="text-green-800 font-medium text-base">
                ✓ Your Google Calendar is connected
              </Text>
            </View>
            
            <View className="flex-row justify-between items-center mb-3 py-3 border-b border-gray-200">
              <Text className="text-base font-medium">Sync calendar events</Text>
              <Switch
                value={isCalendarSyncEnabled}
                onValueChange={handleToggleSync}
                trackColor={{ false: "#ddd", true: "#4caf50" }}
                thumbColor={isCalendarSyncEnabled ? "#fff" : "#f4f3f4"}
              />
            </View>
            
            <Text className="text-gray-600 text-sm mb-8 leading-5">
              When enabled, your meetings will automatically be added to your Google Calendar.
            </Text>
            
            <TouchableOpacity
              onPress={handleDisconnect}
              className="mt-4 bg-white shadow-sm shadow-zinc-300 rounded-full py-3 border border-gray-300"
            >
              <Text className="text-red-600 text-center font-medium">Disconnect Calendar</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View className="bg-orange-50 p-4 rounded-xl mb-6">
              <Text className="text-orange-800 font-medium text-base">
                Your Google Calendar is not connected
              </Text>
            </View>
            
            <Text className="text-gray-600 text-sm mb-8 leading-5">
              Connect your Google Calendar to schedule meetings seamlessly and never miss an important event.
            </Text>
            
            <TouchableOpacity
              onPress={() => connectCalendar('./calendar-settings')}
              className="bg-blue-500 shadow-md shadow-blue-300 rounded-full py-3"
            >
              <Text className="text-white text-center font-semibold">Connect Google Calendar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default CalendarSettingsScreen;
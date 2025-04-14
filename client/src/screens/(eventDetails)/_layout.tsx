import React from 'react';
import { Stack } from 'expo-router';

// This is a simple stack layout for the event details
export default function EventDetailsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}

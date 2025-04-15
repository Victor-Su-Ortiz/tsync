import React from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import UserProfile from '@/src/components/UserProfile';

export default function UserProfileScreen() {
  const params = useLocalSearchParams();
  const userData = params.userData ? JSON.parse(params.userData as string) : null;
  const isCurrentUser = params.isCurrentUser === 'true';

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00cc99" />
          <Text>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <UserProfile userData={userData} isCurrentUser={isCurrentUser} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

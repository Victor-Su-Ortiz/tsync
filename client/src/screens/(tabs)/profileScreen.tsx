// screens/(tabs)/profileScreen.tsx
import React from 'react';
import { StyleSheet, SafeAreaView, View } from 'react-native';
import { Stack } from 'expo-router';
import UserProfile from '@/src/components/UserProfile';
import { useAuth } from '@/src/context/AuthContext';

export default function ProfileScreen() {
  const { userInfo } = useAuth();

  // Format user data for the UserProfile component
  const userData = {
    id: userInfo?.id || userInfo?.id || '',
    name: userInfo?.name || 'User',
    profilePicture: userInfo?.picture || userInfo?.profilePicture || '',
    bio: userInfo?.bio || '',
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <UserProfile userData={userData} isCurrentUser={true} showHeader={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#00cc99',
  },
  bioContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  bioText: {
    fontSize: 16,
    color: '#555',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 25,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 16,
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00cc99',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  signOutButton: {
    marginTop: 40,
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#666',
    fontSize: 16,
  },
});

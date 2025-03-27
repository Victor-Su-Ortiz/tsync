import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import images from '../../constants/images';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { RelativePathString } from 'expo-router';
import UserProfile from '@/src/components/UserProfile';

export default function ProfileScreen() {
  const { userInfo, logout } = useAuth();

  // Default stats if not available from the API
  const stats = {
    friends: 42,
    eventsAttended: 10,
    eventsHosted: 10,
  };

  useEffect(() => console.log(userInfo));

  // <to fix>
  const handleSignOut = async () => {
    try {
      // Sign out from Google
      await GoogleSignin.signOut();

      // Clear local auth state
      await logout();

      // Navigate to login screen
      router.replace('/' as RelativePathString);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.avatarContainer}>
        <Image
          source={
            userInfo?.picture || userInfo?.profilePicture
              ? { uri: userInfo?.picture || userInfo?.profilePicture }
              : images.defaultpfp
          }
          style={styles.avatar}
        />
      </View>

      <Text style={styles.nameText}>{userInfo?.name || 'User'}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.friends}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.eventsAttended}</Text>
          <Text style={styles.statLabel}>Attended</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.eventsHosted}</Text>
          <Text style={styles.statLabel}>Hosted</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
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

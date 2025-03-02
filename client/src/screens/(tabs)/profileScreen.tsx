import React from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import images from '../../constants/images';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function ProfileScreen() {
  const { userInfo, logout } = useAuth();

  // Default stats if not available from the API
  const stats = {
    friends: 42,
    eventsAttended: 10,
    eventsHosted: 10
  };

  const handleSignOut = async () => {
    try {
      // Sign out from Google
      await GoogleSignin.signOut();

      // Clear local auth state
      await logout();

      // Navigate to login screen
      router.replace('./login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Text style={styles.nameText}>{userInfo?.name || 'User'}</Text>

      <View style={styles.avatarContainer}>
        <Image
          source={userInfo?.picture ? { uri: userInfo.picture } : images.defaultpfp}
          style={styles.avatar}
        />
      </View>

      <View style={styles.bioContainer}>
        <Text style={styles.bioText}>{userInfo?.bio || "Let's meet!"}</Text>
      </View>

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

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
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
    borderColor: '#e1e1e1',
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
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
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
  }
});
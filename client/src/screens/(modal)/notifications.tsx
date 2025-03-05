import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Sample notification data
const SAMPLE_NOTIFICATIONS = [
  {
    id: '1',
    title: 'New Tea Shop Opening!',
    message: 'Green Leaf Tea has just opened near you. Check it out!',
    timestamp: '2 hours ago',
    read: false,
    type: 'promotion'
  },
  {
    id: '2',
    title: 'Your Friend is at Matcha Haven',
    message: 'Sarah is currently enjoying tea at Matcha Haven',
    timestamp: '3 hours ago',
    read: false,
    type: 'social'
  },
  {
    id: '3',
    title: 'Weekly Special Deal',
    message: 'Buy one get one free at Zen Tea Room this weekend!',
    timestamp: '1 day ago',
    read: true,
    type: 'promotion'
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);

  const markAsRead = (id: any) => {
    setNotifications(
      notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const getIconForType = (type: any) => {
    switch (type) {
      case 'promotion':
        return <Ionicons name="pricetag" size={24} color="#00cc99" />;
      case 'social':
        return <Ionicons name="people" size={24} color="#FF9500" />;
      default:
        return <Ionicons name="notifications" size={24} color="#00cc99" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.dismiss()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#00cc99" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.clearAllButton}
          onPress={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
        >
          <Text style={styles.clearAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.notificationItem, item.read ? styles.readNotification : styles.unreadNotification]}
            onPress={() => markAsRead(item.id)}
          >
            <View style={styles.notificationIcon}>
              {getIconForType(item.type)}
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={50} color="#ccc" />
            <Text style={styles.emptyStateText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearAllButton: {
    padding: 5,
  },
  clearAllText: {
    color: '#00cc99',
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
  },
  readNotification: {
    backgroundColor: 'white',
  },
  notificationIcon: {
    marginRight: 16,
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00cc99',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#888',
  },
});
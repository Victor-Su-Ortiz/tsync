import React, { useEffect, useState } from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, GestureResponderEvent, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import images from '../../constants/images';
import { useAuth } from '../../context/AuthContext';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { userInfo } = useAuth();
  const pathname = usePathname();

  // Track the current screen for returning to it after add-event
  const [currentScreen, setCurrentScreen] = useState('/home');

  // Update the current screen when the pathname changes
  useEffect(() => {
    // Only update for main tab screens, not for the add-event screen
    if (pathname && !pathname.includes('add-event')) {
      setCurrentScreen(pathname);
    }
  }, [pathname]);

  const CustomTabBarButton = ({
    children,
    onPress,
  }: {
    children: React.ReactNode;
    onPress?: (event: GestureResponderEvent) => void;
  }) => (
    <TouchableOpacity
      style={{
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onPress={onPress}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: '#00cc99',
          ...styles.shadow,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {children}
      </View>
    </TouchableOpacity>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 5 : 0),
          ...styles.shadow,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="home" size={24} color={focused ? '#00cc99' : '#748c94'} />
          ),
        }}
      />

      <Tabs.Screen
        name="eventScreen"
        options={{
          title: 'eventScreen',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="time-outline" size={24} color={focused ? '#00cc99' : '#748c94'} />
          ),
        }}
      />

      <Tabs.Screen
        name="add-event"
        options={{
          title: 'Add Event',
          tabBarButton: props => (
            <CustomTabBarButton
              onPress={() => {
                // Pass the current screen as a query parameter
                router.push({
                  pathname: './add-event',
                  params: { sourceScreen: currentScreen },
                });
              }}
            >
              <Ionicons name="add" size={30} color="#ffffff" />
            </CustomTabBarButton>
          ),
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ focused }) => (
            <Ionicons name="calendar" size={24} color={focused ? '#00cc99' : '#748c94'} />
          ),
        }}
      />

      <Tabs.Screen
        name="profileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                userInfo?.picture || userInfo?.profilePicture
                  ? { uri: userInfo?.picture || userInfo?.profilePicture }
                  : images.defaultpfp
              }
              style={{
                width: 34,
                height: 33,
                borderRadius: 22,
                borderWidth: 1.5,
                borderColor: focused ? '#00cc99' : '#748c94',
                opacity: focused ? 1 : 0.85,
                backgroundColor: focused ? undefined : '#f5f5f5',
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#7F5DF0',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
});

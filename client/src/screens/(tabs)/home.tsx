import React, { useEffect, useState } from 'react';
import { StyleSheet, Alert, Text, ActivityIndicator, FlatList, View, Image, ImageBackground, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from 'expo-location';
import axios from 'axios';
import { GOOGLE_PLACES_API } from '@env';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import UserSearch from '../../components/UserSearch';
import { useAuth } from '@/src/context/AuthContext';

type Place = {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  photos?: { photo_reference: string }[];
};

export default function Home() {

  const params = useLocalSearchParams();
  const isSelectingTeaShop = params.selectingTeaShop === 'true';
  const [selectionMode, setSelectionMode] = useState<'normal' | 'tea-shop-selection'>('normal');
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0); // Sample notification count
  const { authToken } = useAuth();

  // useEffect(() => {
  //   const checkNavigationMode = async () => {
  //     if (params.selectingTeaShop === 'true') {
  //       setSelectionMode('tea-shop-selection');
  //       // Store that we're in selection mode
  //       await AsyncStorage.setItem('navigationMode', 'tea-shop-selection');
  //     } else {
  //       // Check if we have a stored mode
  //       const storedMode = await AsyncStorage.getItem('navigationMode');
  //       if (storedMode === 'tea-shop-selection') {
  //         setSelectionMode('tea-shop-selection');
  //       } else {
  //         setSelectionMode('normal');
  //         // Clear any stored selection mode
  //         await AsyncStorage.removeItem('navigationMode');
  //       }
  //     }
  //   };

  //   checkNavigationMode();
  // }, [params.selectingTeaShop]);


  const handleTeaShopPress = async (teaShop: Place) => {
    return;
    // if (selectionMode === 'tea-shop-selection') {
    //   // If we're in selection mode, navigate back to add-event with the selected shop
    //   // Clear the selection mode for next time
    //   await AsyncStorage.removeItem('navigationMode');

    //   router.push({
    //     pathname: './add-event',
    //     params: {
    //       teaShopName: teaShop.name,
    //     }
    //   });
    // } else {
    //   // Normal tea shop interaction (e.g., view details)
    //   console.log("Implement normal tea shop interaction.");
    //   // Implement your normal tea shop interaction here
    // }
  };

  const handleNotificationPress = () => {
    // Navigate to the notifications screen using the modal route
    router.push('./../(modal)/notifications');
  };

  const GOOGLE_PLACES_API_KEY = GOOGLE_PLACES_API;

  const getUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission denied", 'Allow location access to find nearby stores!');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});

    console.log(authToken);

    // console.log(location.coords.latitude, location.coords.longitude);
    setLocation(location.coords);
    return location.coords;
  };

  const getNearbyStores = async (latitude: number, longitude: number) => {
    setLoading(true);
    const radius = 5000;
    const type = 'cafe';

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&keyword=tea&key=${GOOGLE_PLACES_API_KEY}`;

    try {
      const response = await axios.get(url);
      setShops(response.data.results);
      // console.log(response.data.results); // List of tea shops
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (location) {
      getNearbyStores(location.latitude, location.longitude);
    }
  }, [location]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white', padding: 16 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Tea Shops 🍵</Text>

        {/* Notification Icon */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={handleNotificationPress}
        >
          <Ionicons name="notifications" size={24} color="#00cc99" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Button */}
      <TouchableOpacity
        style={styles.searchButton}
        onPress={() => setSearchModalVisible(true)}
      >
        <Ionicons name="search" size={20} color="#fff" />
        <Text style={styles.searchButtonText}>Search nearby users</Text>
      </TouchableOpacity>

      {/* User Search Modal Component */}
      <UserSearch
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        accessToken={authToken}
      />

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#00cc99" />
        </View>
      ) : (
        <FlatList
          data={shops as Place[]}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => {
            const photoRef = item.photos?.[0]?.photo_reference;
            const imageUrl = photoRef
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`
              : "https://via.placeholder.com/400";

            return (
              <TouchableOpacity onPress={() => handleTeaShopPress(item)}>
                <ImageBackground source={{ uri: imageUrl }} style={styles.itemContainer} imageStyle={styles.image}>
                  <View style={styles.overlay}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.address}>{item.vicinity}</Text>
                    <Text style={styles.rating}>Rating: ⭐ {item.rating || 'N/A'}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  notificationButton: {
    position: 'relative',
    padding: 5,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4B4B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00cc99',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  itemContainer: {
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    justifyContent: "flex-end",
  },
  image: {
    borderRadius: 10,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  address: {
    color: "#ddd",
  },
  rating: {
    marginTop: 4,
    fontSize: 14,
    color: "white",
  },
});
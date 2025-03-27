import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import axios from "axios";
import { GOOGLE_PLACES_API } from "@env";

type Place = {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  photos?: { photo_reference: string }[];
};

type TeaShopSelectionModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onSelectTeaShop: (teaShop: Place) => void;
};

const TeaShopSelectionModal = ({
  isVisible,
  onClose,
  onSelectTeaShop,
}: TeaShopSelectionModalProps) => {
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [shops, setShops] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  const GOOGLE_PLACES_API_KEY = GOOGLE_PLACES_API;

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      return location.coords;
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const getNearbyStores = async (latitude: number, longitude: number) => {
    setLoading(true);
    const radius = 5000;
    const type = "cafe";

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&keyword=tea&key=${GOOGLE_PLACES_API_KEY}`;

    try {
      const response = await axios.get(url);
      setShops(response.data.results);
    } catch (error) {
      console.error("Error fetching nearby stores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      const fetchLocation = async () => {
        const coords = await getUserLocation();
        if (coords) {
          getNearbyStores(coords.latitude, coords.longitude);
        }
      };

      fetchLocation();
    }
  }, [isVisible]);

  const handleTeaShopPress = (teaShop: Place) => {
    onSelectTeaShop(teaShop);
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#00cc99" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Tea Shop</Text>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00cc99" />
            <Text style={styles.loadingText}>Finding nearby tea shops...</Text>
          </View>
        ) : (
          <FlatList
            data={shops}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => {
              const photoRef = item.photos?.[0]?.photo_reference;
              const imageUrl = photoRef
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`
                : "https://via.placeholder.com/400";

              return (
                <TouchableOpacity onPress={() => handleTeaShopPress(item)}>
                  <ImageBackground
                    source={{ uri: imageUrl }}
                    style={styles.itemContainer}
                    imageStyle={styles.image}
                  >
                    <View style={styles.overlay}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.address}>{item.vicinity}</Text>
                      <Text style={styles.rating}>
                        Rating: ⭐ {item.rating || "N/A"}
                      </Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16,
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

export default TeaShopSelectionModal;

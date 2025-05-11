// QRScannerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useFriends } from '@/src/context/FriendRequestContext';

const QRScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  // Use string values for flashMode instead of enum
  const [flashMode, setFlashMode] = useState('off');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);
  const router = useRouter();
  const { userInfo } = useAuth();
  const { sendFriendRequest } = useFriends();

  // Request camera permissions
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  // Toggle flash mode
  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'torch' : 'off');
  };

  // Handle QR code scanning
  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      console.log('Scanned QR code data:', data);

      // Try to parse the QR code data
      const parsedData = JSON.parse(data);

      // Check if it's a friend request QR code
      if (parsedData?.type === 'friend-request' && parsedData?.userId) {
        // Make sure we're not trying to add ourselves
        if (parsedData.userId === userInfo?.id) {
          Alert.alert('Cannot add yourself', 'You cannot send a friend request to yourself.');
          return;
        }

        // Handle the friend request
        await handleFriendRequest(parsedData);
      } else {
        // Not a valid friend request QR code
        Alert.alert('Invalid QR Code', 'This QR code is not a valid friend request QR code.');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        'Error Processing QR Code',
        'The scanned QR code could not be processed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Process the friend request from QR data
  const handleFriendRequest = async qrData => {
    try {
      await sendFriendRequest(qrData.userId);
      Alert.alert(
        'Friend Request Sent',
        `Your friend request to ${qrData.name || 'user'} has been sent.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.', [
        {
          text: 'Try Again',
          onPress: () => setScanned(false),
        },
        {
          text: 'Cancel',
          onPress: () => router.back(),
          style: 'cancel',
        },
      ]);
    }
  };

  // Handle permission denied
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>We need camera permissions to scan QR codes.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={() => router.back()}>
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // While waiting for permissions
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00cc99" />
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera Component */}
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={CameraType.back}
        // Pass the flashMode as a property of Camera.Constants.FlashMode
        flashMode={Camera.Constants.FlashMode[flashMode]}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: ['qr'],
        }}
      >
        {/* Overlay Content */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
              <Ionicons
                name={flashMode === 'off' ? 'flash-off' : 'flash'}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {/* Scanner Target */}
          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#00cc99" />
                  <Text style={styles.loadingText}>Processing...</Text>
                </View>
              )}
            </View>

            <Text style={styles.scannerText}>Position the QR code within the frame to scan</Text>
          </View>

          {/* Rescan Button (if already scanned) */}
          {scanned && !loading && (
            <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
              <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </Camera>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  flashButton: {
    padding: 8,
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00cc99',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scannerText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  rescanButton: {
    backgroundColor: '#00cc99',
    padding: 16,
    borderRadius: 30,
    marginBottom: 32,
    alignItems: 'center',
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#00cc99',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '80%',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScannerScreen;

// src/app/qr-scanner.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { BarCodeScannedCallback } from 'expo-barcode-scanner';
import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useFriends } from '@/src/context/FriendRequestContext';
import { FriendStatus } from '@/src/utils/enums';
import { CameraView, Camera } from 'expo-camera';

type QRFriendData = {
  type: string;
  userId: string;
  name: string;
};

export default function QRScannerScreen() {
  const router = useRouter();
  const { userInfo } = useAuth();
  const { sendFriendRequest, getFriendStatus } = useFriends();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    userData?: { id: string; name: string };
  } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned: BarCodeScannedCallback = async ({ type, data }) => {
    try {
      setScanned(true);

      // Parse the QR code data
      let qrData: QRFriendData;
      try {
        qrData = JSON.parse(data);
      } catch (error) {
        console.error('Invalid QR code format:', error);
        setScanResult({
          success: false,
          message: 'Invalid QR code format. Please scan a valid Friend QR code.',
        });
        return;
      }

      // Validate QR code is a friend request
      if (qrData.type !== 'friend-request' || !qrData.userId || !qrData.name) {
        setScanResult({
          success: false,
          message: 'This QR code is not a valid Friend QR code.',
        });
        return;
      }

      // Prevent adding yourself
      if (qrData.userId === userInfo?.id) {
        setScanResult({
          success: false,
          message: 'You cannot add yourself as a friend.',
        });
        return;
      }

      // Check if already friends or has pending request
      const { status: friendStatus } = getFriendStatus(qrData.userId);

      if (friendStatus === FriendStatus.FRIENDS) {
        setScanResult({
          success: false,
          message: `You are already friends with ${qrData.name}.`,
          userData: { id: qrData.userId, name: qrData.name },
        });
        return;
      }

      if (friendStatus === FriendStatus.PENDING) {
        setScanResult({
          success: false,
          message: `You already have a pending request to ${qrData.name}.`,
          userData: { id: qrData.userId, name: qrData.name },
        });
        return;
      }

      if (friendStatus === FriendStatus.INCOMING_REQUEST) {
        setScanResult({
          success: false,
          message: `${qrData.name} already sent you a friend request. Check your notifications to accept it.`,
          userData: { id: qrData.userId, name: qrData.name },
        });
        return;
      }

      // Send friend request
      setIsLoading(true);
      await sendFriendRequest(qrData.userId);

      setScanResult({
        success: true,
        message: `Friend request sent to ${qrData.name}!`,
        userData: { id: qrData.userId, name: qrData.name },
      });
    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanResult({
        success: false,
        message: 'Failed to process friend request. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScanResult(null);
  };

  const handleViewProfile = () => {
    if (scanResult?.userData) {
      // Navigate to the user profile
      router.push({
        pathname: '/profile/[id]' as RelativePathString,
        params: { id: scanResult.userData.id },
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00cc99" />
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>QR Scanner</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={60} color="#ff3b30" />
          <Text style={styles.title}>Camera Permission Denied</Text>
          <Text style={styles.text}>
            We need camera access to scan QR codes. Please enable camera permissions in your device
            settings.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Scanner</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.scannerContainer}>
        {!scanned ? (
          <>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={styles.scanner}
            />
            <View style={styles.overlay}>
              <View style={styles.overlayRect} />
              <Text style={styles.scanText}>Scan a Friend QR Code</Text>
            </View>
          </>
        ) : (
          <View style={styles.resultContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#00cc99" />
            ) : (
              <>
                <Ionicons
                  name={scanResult?.success ? 'checkmark-circle' : 'close-circle'}
                  size={70}
                  color={scanResult?.success ? '#00cc99' : '#ff3b30'}
                />
                <Text style={styles.title}>{scanResult?.success ? 'Success!' : 'Scan Failed'}</Text>
                <Text style={styles.resultText}>{scanResult?.message}</Text>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={handleScanAgain}>
                    <Ionicons name="scan" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Scan Again</Text>
                  </TouchableOpacity>

                  {scanResult?.userData && (
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: '#4a90e2' }]}
                      onPress={handleViewProfile}
                    >
                      <Ionicons name="person" size={20} color="#fff" />
                      <Text style={styles.buttonText}>View Profile</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 8,
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scanner: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayRect: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00cc99',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  resultText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  button: {
    backgroundColor: '#00cc99',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 8,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});

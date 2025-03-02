import { Text, TouchableOpacity, View, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import images from '../constants/images';
import React, { useEffect } from "react";
import { GOOGLE_IOS_ID, GOOGLE_WEB_ID } from "@env"
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

interface UserInfo {
  id?: string;
  name?: string | null;
  email?: string;
  picture?: string | null; // URL to profile picture
  bio?: string;
}

export default function Index() {
  const router = useRouter();
  const handleLogin = () => router.push("./login");
  const handleRegister = () => router.push("./register");
  const { setAccessToken, setUserInfo } = useAuth();

  // Configure Google Sign In once when component mounts
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_ID,
      iosClientId: GOOGLE_IOS_ID,
      offlineAccess: true,
    });
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      // Clear existing tokens in case they're causing issues
      await GoogleSignin.signOut();

      // Start the sign-in flow
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      if (!userInfo || !tokens.idToken) {
        throw new Error("Failed to get ID token from Google");
      }


      // Send the ID token to your backend
      await sendTokenToBackend(tokens.idToken);

      // Store Google user info in context for profile display
      const formattedUserInfo: UserInfo = {
        id: userInfo.data?.user.id,
        name: userInfo.data?.user.name,
        email: userInfo.data?.user.email,
        picture: userInfo.data?.user.photo, // Photo URL from Google
        bio: "Let's meet!" // Default bio
      };

      // Update context with user info for UI display
      setUserInfo(formattedUserInfo);

    } catch (error: any) {
      console.error('Google Sign-In Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in is in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Play services not available');
      } else {
        Alert.alert('Sign-In Error', error.message || 'Something went wrong with Google Sign-In');
      }
    }
  };

  const sendTokenToBackend = async (idToken: string) => {
    try {
      console.log("Sending token to backend:", idToken);

      // Make sure your API is configured with proper error handling
      const res = await api.post("/auth/google", { token: idToken });

      console.log("Backend response:", res.data);

      const { user, token: authToken } = res.data;

      if (!user || !authToken) {
        throw new Error("Invalid response from server");
      }

      // Store the JWT token from your backend
      await AsyncStorage.setItem("authToken", authToken);

      // Store the access token in context
      setAccessToken(authToken);

      // Store user info in AsyncStorage as a string
      await AsyncStorage.setItem("userInfo", JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture || user.photo,
        bio: user.bio || "Let's meet!"
      }));

      Alert.alert("Success", `Welcome ${user.name}!`);
      router.push('./(tabs)/home');
    } catch (error: any) {
      console.error("Backend Auth Error:", error);

      // More detailed error handling
      if (error.response) {
        // The server responded with an error status
        console.error("Server responded with:", error.response.status, error.response.data);
        Alert.alert(
          "Authentication Failed",
          error.response.data?.message || "Server returned an error."
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        Alert.alert(
          "Connection Error",
          "Could not connect to the server. Please check your internet connection."
        );
      } else {
        // Something else happened while setting up the request
        Alert.alert(
          "Login Error",
          error.message || "An unexpected error occurred."
        );
      }
    }
  };

  return (
    <SafeAreaView className="bg-white h-full border-solid">
      <Image source={images.logo} className="w-full h-4/6 bg-white" resizeMode="contain" />
      <View className="top-[-90] items-center flex-1 px-10">
        <Text className="text-5xl text-center uppercase font-extrabold">TSync</Text>
        <Text className="text-1xl font-bold text-center">A scheduling app for all your coffee chats.</Text>

        {/* Sign in with Email */}
        <TouchableOpacity onPress={handleLogin} className='top-20 bg-white shadow-md shadow-zinc-300 rounded-full w-3/4 py-4'>
          <View className='flex flex-row items-center justify-center'>
            <Text>Sign In 🧋</Text>
          </View>
        </TouchableOpacity>

        {/* Register Button */}
        <TouchableOpacity onPress={handleRegister} className='mt-4 top-20 bg-white shadow-md shadow-zinc-300 rounded-full w-3/4 py-4'>
          <View className='flex flex-row items-center justify-center'>
            <Text>Create Account 🧋</Text>
          </View>
        </TouchableOpacity>

        {/* Google Sign-In Button */}
        <TouchableOpacity
          onPress={signInWithGoogle}
          className="mt-6 top-20 bg-white shadow-md shadow-zinc-300 rounded-full w-3/4 py-4 flex flex-row items-center justify-center"
        >
          <Image
            source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" }}
            style={{ width: 24, height: 24, marginRight: 10 }}
          />
          <Text>Sign in with Google</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
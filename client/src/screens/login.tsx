import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Keyboard,
  Button,
  View,
} from "react-native";
import { api } from "../utils/api"; // Import the API instance
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import { ArrowLeft, User } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

// User data
const users = [
  {
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    password: "Password123!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/women/1.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-12"),
  },
  {
    name: "Michael Smith",
    email: "michael.smith@example.com",
    password: "Password456!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-15"),
  },
  {
    name: "Sophia Williams",
    email: "sophia.williams@example.com",
    password: "Password789!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/women/2.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-18"),
  },
  {
    name: "James Brown",
    email: "james.brown@example.com",
    password: "PasswordABC!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/men/2.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-20"),
  },
  {
    name: "Olivia Davis",
    email: "olivia.davis@example.com",
    password: "PasswordXYZ!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/women/3.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-22"),
  },
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUserInfo, setAuthToken } = useAuth();

  const handleForget = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setLoading(true);

    try {
      const response = await api.post("/auth/resetPassword", {
        email,
        password,
      });
      const { token } = response.data;
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, token } = response.data;

      console.log(user);
      setAuthToken(token);
      setUserInfo(user);
      Alert.alert("Success", "Login successful!");
      router.push("./(tabs)/home");
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to handle user selection and login
  const handleUserSelection = async (selectedUser: any) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", {
        email: selectedUser.email,
        password: selectedUser.password,
      });

      const { user, token } = response.data;

      console.log(user);
      setAuthToken(token);
      setUserInfo(user);
      Alert.alert("Success", `Logged in as ${selectedUser.name}`);
      router.push("./(tabs)/home");
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error.response?.data?.message || "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to show user selection alert
  const showUserSelectionAlert = () => {
    // Create buttons for each user
    const buttons = users.map((user) => ({
      text: user.name,
      onPress: () => handleUserSelection(user),
    }));

    // Show alert with user options
    Alert.alert("Select a User", "Choose a user to sign in as:", buttons, {
      cancelable: true,
    });
  };

  return (
    <SafeAreaView className="flex-1 justify-center px-5 bg-gray-100">
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-14 left-5 p-2 bg-white shadow-md shadow-zinc-300 rounded-full"
      >
        <ArrowLeft size={24} />
      </TouchableOpacity>

      <Text className="pb-5 text-2xl font-bold text-center">Sign In 🧋</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#4a90e2", marginTop: 10 }]}
        onPress={showUserSelectionAlert}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Quick User Selection</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#6c757d", marginTop: 10 }]}
        onPress={handleForget}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Forgot my password</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 10,
    width: "100%",
    alignItems: "center",
    borderRadius: 5,
    marginVertical: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Login;

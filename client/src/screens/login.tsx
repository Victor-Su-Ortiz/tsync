import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, Alert, StyleSheet, Keyboard, Button } from 'react-native';
import { api } from "../utils/api"; // Import the API instance
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';
import { ArrowLeft } from "lucide-react-native";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const handleForget = async () => {

    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);

    try {
      const response = await api.post("/auth/resetPassword", { email, password });
      const { token } = response.data;
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token } = response.data;

      // Store JWT token in AsyncStorage for authentication persistence
      await AsyncStorage.setItem("authToken", token);

      Alert.alert("Success", "Login successful!");
      router.push('./(tabs)/home');
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (

    <SafeAreaView className='flex-1 justify-center px-5  bg-gray-100'>
      <TouchableOpacity onPress={() => router.back()} className="absolute top-14 left-5 p-2 bg-white shadow-md shadow-zinc-300 rounded-full">
        <ArrowLeft size={24} />
      </TouchableOpacity>
      <Text className='pb-5 text-2xl font-bold text-center'>Sign In 🧋</Text>
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
      <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />
      <Button title={"Forgot my password"} onPress={handleForget} disabled={loading} />

    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    width: '100%',
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


export default Login;

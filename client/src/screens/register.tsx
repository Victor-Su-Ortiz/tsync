import React, { useState } from "react";
import { View, TextInput, Button, Alert, Text, TouchableOpacity } from "react-native";
import { api } from "../utils/api"; // Import Axios instance
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";

const RegisterScreen = () => {

  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    const userData = {
      name: fullName, // 🔹 Ensure this field name is correct
      email,
      password,
    };

    console.log("📤 Sending Data to Backend:", userData); // Debugging

    try {

      const response = await api.post("/auth/register", userData);
      console.log("✅ Response from Backend:", response.data);
      Alert.alert("Success", "Account created successfully!");
    } catch (error: any) {
      console.error("❌ Registration error:", error.response?.data);
      Alert.alert("Registration Failed", error.response?.data?.message || "Something went wrong.");
    }
  };


  return (
    <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
      <TouchableOpacity onPress={() => router.back()} className="absolute top-14 left-5 p-2 bg-white shadow-md shadow-zinc-300 rounded-full">
        <ArrowLeft size={24} />
      </TouchableOpacity>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>Create an Account</Text>

      <TextInput
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />

      <Button title={loading ? "Registering..." : "Register"} onPress={handleRegister} disabled={loading} />
    </View>
  );
};

export default RegisterScreen;
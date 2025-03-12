import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppRegistry, SafeAreaView, Text, View } from "react-native";
import '../global.css'
import Login from "./screens/login";
import { ExpoRoot } from "expo-router";
import { AuthProvider } from './context/AuthContext';
import InfiniteScrollCalendar from "./screens/(tabs)/events";
import { SocketProvider } from "./context/SocketContext";
import { Socket } from "socket.io-client";



const Stack = createNativeStackNavigator();


export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ExpoRoot context={require.context('./screens')} />
        {/* <InfiniteScrollCalendar /> */}
      </SocketProvider>
    </AuthProvider>

  )
}

// registerRootComponent(App)
AppRegistry.registerComponent("main", () => App);
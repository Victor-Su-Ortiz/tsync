import { Stack } from "expo-router";
import Login from "./login";

export default function RootLayout() {
  // return <Stack screenOptions={{ headerShown: false }} />;
  return <Login />;
}

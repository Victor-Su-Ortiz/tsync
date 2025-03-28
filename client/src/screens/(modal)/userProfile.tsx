import { useLocalSearchParams } from 'expo-router';
import UserProfile, { User } from '../../components/UserProfile';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function UserProfileScreen() {
  const { user: userString } = useLocalSearchParams<{ user?: string }>();
  const user: User | null = userString ? JSON.parse(userString) : null;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      setLoading(false);
    };
    fetchUser();
  }, [user]);

  if (!user) {
    return <View><ActivityIndicator size="large" /></View>;
  }

  return <UserProfile user={user} />;
}

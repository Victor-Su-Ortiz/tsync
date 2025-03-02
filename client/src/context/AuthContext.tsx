import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserInfo {
  id?: string;
  name?: string | null;
  email?: string;
  picture?: string | null; // URL to profile picture
  bio?: string;
}


interface AuthContextType {
  accessToken: string;
  setAccessToken: (token: string) => void;
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo | null) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load stored auth data when the component mounts
  useEffect(() => {
    const loadStoredAuthData = async () => {
      try {
        // Load access token
        const storedToken = await AsyncStorage.getItem('accessToken');
        if (storedToken) {
          setAccessToken(storedToken);
        }

        // Load user info
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        if (storedUserInfo) {
          setUserInfo(JSON.parse(storedUserInfo));
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuthData();
  }, []);

  // Persist access token when it changes
  useEffect(() => {
    const storeToken = async () => {
      try {
        if (accessToken) {
          await AsyncStorage.setItem('accessToken', accessToken);
        } else {
          await AsyncStorage.removeItem('accessToken');
        }
      } catch (error) {
        console.error('Error storing access token:', error);
      }
    };

    storeToken();
  }, [accessToken]);

  // Persist user info when it changes
  useEffect(() => {
    const storeUserInfo = async () => {
      try {
        if (userInfo) {
          // Convert userInfo object to a JSON string before storing
          const userInfoString = JSON.stringify(userInfo);
          await AsyncStorage.setItem('userInfo', userInfoString);
        } else {
          await AsyncStorage.removeItem('userInfo');
        }
      } catch (error) {
        console.error('Error storing user info:', error);
      }
    };

    storeUserInfo();
  }, [userInfo]);

  // Logout function to clear auth data
  const logout = async () => {
    try {
      setAccessToken('');
      setUserInfo(null);
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('userInfo');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        setAccessToken,
        userInfo,
        setUserInfo,
        isLoading,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
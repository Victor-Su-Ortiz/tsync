import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserInfo {
  id?: string;
  name?: string | null;
  email?: string;
  profilePicture?: string | null; // URL to profile picture
  picture?: string | null; // URL for test accounts
  bio?: string;
}

interface AuthContextType {
  authToken: string;
  setAuthToken: (token: string) => void;
  idToken: string;
  setIdToken: (token: string) => void;
  accessToken: string;
  setAccessToken: (token: string) => void;
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo | null) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthToken] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [idToken, setIdToken] = useState<string>('');

  // Load stored auth data when the component mounts
  useEffect(() => {
    const loadStoredAuthData = async () => {
      try {
        // Load JWT token
        const authToken = await AsyncStorage.getItem('authToken');
        if (authToken) {
          setAuthToken(authToken);
        }

        // Load access token
        const storedToken = await AsyncStorage.getItem('accessToken');
        if (storedToken) {
          setAccessToken(storedToken);
        }

        // Load ID token
        const idToken = await AsyncStorage.getItem('idToken');
        if (idToken) {
          setIdToken(idToken);
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
    const storeAuthToken = async () => {
      try {
        if (authToken) {
          await AsyncStorage.setItem('authToken', authToken);
        } else {
          await AsyncStorage.removeItem('authTOken');
        }
      } catch (error) {
        console.error('Error storing auth token:', error);
      }
    };

    const storeAccessToken = async () => {
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

    const storeIdToken = async () => {
      try {
        if (idToken) {
          await AsyncStorage.setItem('idToken', idToken);
        } else {
          await AsyncStorage.removeItem('idToken');
        }
      } catch (error) {
        console.error('Error storing ID token:', error);
      }
    };

    storeAccessToken();
    storeIdToken();
    storeAuthToken();
  }, [accessToken, idToken, authToken]);

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
      setAuthToken('');
      setIdToken('');
      setAccessToken('');
      setUserInfo(null);
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('userInfo');
      await AsyncStorage.removeItem('idToken');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authToken,
        setAuthToken,
        idToken,
        setIdToken,
        accessToken,
        setAccessToken,
        userInfo,
        setUserInfo,
        isLoading,
        logout,
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

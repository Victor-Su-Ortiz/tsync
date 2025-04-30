// src/context/FriendRequestContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { api } from '../utils/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { EXPO_PUBLIC_API_URL } from '@env';
import { FriendRequestStatus, FriendStatus } from '../utils/enums';

// Define types for friend data
export type Friend = {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
};

export type FriendRequest = {
  _id: string;
  sender: Friend;
  receiver: Friend;
  status: FriendRequestStatus;
  createdAt: string;
};

// Define the context structure
type FriendContextType = {
  friends: string[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  loading: boolean;
  error: string | null;
  getFriendStatus: (userId: string) => {
    status: FriendStatus;
    requestId?: string;
  };

  sendFriendRequest: (userId: string, userName?: string) => Promise<any>;
  acceptFriendRequest: (requestId: string, userName?: string) => Promise<any>;
  rejectFriendRequest: (requestId: string, userName?: string) => Promise<any>;
  cancelFriendRequest: (requestId: string) => Promise<any>;
  removeFriend: (friendId: string) => Promise<any>;
  refreshFriendData: () => Promise<void>;
};

// Create the context
const FriendContext = createContext<FriendContextType>({
  friends: [],
  receivedRequests: [],
  sentRequests: [],
  loading: false,
  error: null,
  sendFriendRequest: async () => {},
  acceptFriendRequest: async () => {},
  rejectFriendRequest: async () => {},
  cancelFriendRequest: async () => {},
  removeFriend: async () => {},
  refreshFriendData: async () => {},
  getFriendStatus: () => ({ status: FriendStatus.NONE }),
});

// Create the provider component
export const FriendProvider = ({ children }: { children: React.ReactNode }) => {
  const [friends, setFriends] = useState<string[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, authToken } = useAuth();
  const { socket } = useSocket();

  // Use useCallback for refreshFriendData to maintain the same reference
  const refreshFriendData = useCallback(async () => {
    if (!isAuthenticated || !authToken) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch friends list
      const friendsResponse = await api.get('/friends', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Fetch pending friend requests
      const pendingResponse = await api.get('/friends/requests/received', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Fetch sent friend requests
      const sentResponse = await api.get('/friends/requests/sent', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('sent response', sentResponse.data);
      console.log('pending response', pendingResponse.data);
      console.log('friends response', friendsResponse.data);

      // Set friends from the response
      const friendIds = friendsResponse.data.friends.map((friend: Friend) => friend._id);
      setFriends(friendIds);

      // Filter out rejected requests from received requests
      const pendingRequests = pendingResponse.data.requests.filter(
        (req: FriendRequest) => req.status !== FriendRequestStatus.REJECTED,
      );
      setReceivedRequests(pendingRequests);

      // Filter out rejected requests from sent requests
      const activeSentRequests = sentResponse.data.requests.filter(
        (req: FriendRequest) => req.status !== FriendRequestStatus.REJECTED,
      );
      setSentRequests(activeSentRequests);

      console.log('Updated friend data - filtered out rejected requests');
    } catch (err: any) {
      console.error('Error fetching friend data:', err);
      setError(err.response?.data?.message || 'Failed to fetch friend data');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authToken]);

  const getFriendStatus = useCallback(
    (userId: string): { status: FriendStatus; requestId?: string } => {
      console.log('=== Getting Friend Status ===');
      // Safety check for userId
      if (!userId) {
        return { status: FriendStatus.NONE };
      }
      console.log('current friends', friends);

      // Check if the user is already a friend
      const friend = friends.find(f => {
        if (!f) return false;
        return f === userId;
      });

      if (friend) {
        return { status: FriendStatus.FRIENDS };
      }

      // Check for received requests (where the specified user is the sender)
      const received = receivedRequests.find(req => {
        if (!req) return false;

        if (req.sender && typeof req.sender === 'object') {
          return req.sender._id === userId;
        }

        return false;
      });

      if (received) {
        return { status: FriendStatus.INCOMING_REQUEST, requestId: received._id };
      }

      // Check for sent requests (where the specified user is the receiver)
      const sent = sentRequests.find(req => {
        if (!req) return false;

        if (req.receiver && typeof req.receiver === 'object') {
          return req.receiver._id === userId;
        }

        return false;
      });

      if (sent) {
        return { status: FriendStatus.PENDING, requestId: sent._id };
      }

      return { status: FriendStatus.NONE };
    },
    [friends, receivedRequests, sentRequests],
  );

  // Load friend data on component mount or when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshFriendData();
    }
  }, [isAuthenticated, refreshFriendData]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleFriendRequest = (data: any) => {
      console.log('Socket: Received friend request', data);
      // Use a functional update to ensure we're working with the latest state
      setReceivedRequests(prev => {
        const newRequests = [data, ...prev];
        console.log('Updated received requests:', newRequests.length);
        return newRequests;
      });
    };

    const handleFriendRequestCanceled = (data: any) => {
      console.log('Socket: Friend request canceled', data);
      setReceivedRequests(prev => {
        const filtered = prev.filter(req => req._id !== data._id);
        console.log('Filtered received requests:', filtered.length);
        return filtered;
      });
    };

    const handleFriendAccepted = (data: any) => {
      console.log('Socket: Friend request accepted', data);
      // Remove from sent requests
      setSentRequests(prev => prev.filter(req => req._id !== data._id));

      // Add to friends list if not already there
      setFriends(prev => {
        if (!prev.some(friend => friend === data.user._id)) {
          console.log('Adding new friend:', data.user.name);
          return [...prev, data.user._id];
        }
        return prev;
      });
    };

    const handleFriendRejected = (data: any) => {
      console.log('Socket: Friend request rejected', data);
      setSentRequests(prev => prev.filter(req => req._id !== data._id));
    };

    const handleFriendRemoved = (data: any) => {
      console.log('Socket: Friend removed', data);
      setFriends(prev => prev.filter(friend => friend !== data._id));
    };

    // Register event listeners
    socket.on('friend_request', handleFriendRequest);
    socket.on('friend_request_canceled', handleFriendRequestCanceled);
    socket.on('friend_accepted', handleFriendAccepted);
    socket.on('friend_rejected', handleFriendRejected);
    socket.on('friend_removed', handleFriendRemoved);

    console.log('Set up socket listeners for friend events');

    // Clean up listeners on unmount
    return () => {
      socket.off('friend_request', handleFriendRequest);
      socket.off('friend_request_canceled', handleFriendRequestCanceled);
      socket.off('friend_accepted', handleFriendAccepted);
      socket.off('friend_rejected', handleFriendRejected);
      socket.off('friend_removed', handleFriendRemoved);

      console.log('Cleaned up socket listeners for friend events');
    };
  }, [socket]);

  // Enhanced send friend request with alerts
  const sendFriendRequest = async (userId: string, userName?: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Sending friend request to: ${userId}`);
      const response = await api.post(
        `/friends/requests/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      console.log('Friend request sent successfully:', response.data);

      // Add the new request to the sent requests list
      setSentRequests(prev => [...prev, response.data.request]);

      // Show success message if userName is provided
      if (userName) {
        Alert.alert('Friend Request Sent', `Your friend request to ${userName} has been sent.`);
      }

      return response.data;
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setError(err.response?.data?.message || 'Failed to send friend request');

      // Show error alert if userName is provided
      if (userName) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to send friend request');
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced accept friend request with alerts
  const acceptFriendRequest = async (requestId: string, userName?: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Accepting friend request: ${requestId}`);
      const response = await api.put(
        `/friends/requests/${requestId}/accept`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      // Find the request that was accepted
      const acceptedRequest = receivedRequests.find(req => req._id === requestId);

      if (!acceptedRequest) {
        console.warn('Could not find the accepted request in state');
        // Force a complete data refresh instead
        await refreshFriendData();
      } else {
        // Remove from pending requests immediately
        setReceivedRequests(prev => prev.filter(req => req._id !== requestId));

        // Add to friends list if not already there
        const senderId = acceptedRequest.sender._id;
        console.log('current accepted', acceptedRequest);
        setFriends(prev => {
          if (!prev.some(friendId => friendId === senderId)) {
            return [...prev, acceptedRequest.sender._id];
          }
          return prev;
        });
      }

      // Show success message if userName is provided
      if (userName) {
        Alert.alert('Friend Request Accepted', `You are now friends with ${userName}.`);
      }

      return response.data;
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError(err.response?.data?.message || 'Failed to accept friend request');

      // Show error alert if userName is provided
      if (userName) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to accept friend request');
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced reject friend request with alerts
  const rejectFriendRequest = async (requestId: string, userName?: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Rejecting friend request: ${requestId}`);
      const response = await api.put(
        `/friends/requests/${requestId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );

      console.log('Friend request rejected successfully');

      // Remove from pending requests immediately and permanently
      setReceivedRequests(prev => {
        const filtered = prev.filter(req => req._id !== requestId);
        console.log(`Removed request ${requestId}, new count: ${filtered.length}`);
        return filtered;
      });

      // Show success message if userName is provided
      if (userName) {
        Alert.alert(
          'Friend Request Declined',
          `Friend request from ${userName} has been declined.`,
        );
      }

      return response.data;
    } catch (err: any) {
      console.error('Error rejecting friend request:', err);
      setError(err.response?.data?.message || 'Failed to reject friend request');

      // Show error alert if userName is provided
      if (userName) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to reject friend request');
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced cancel friend request with alerts
  const cancelFriendRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Canceling friend request: ${requestId}`);
      const response = await api.delete(`/friends/requests/${requestId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('Friend request canceled successfully');

      // Remove from sent requests immediately
      setSentRequests(prev => {
        const filtered = prev.filter(req => req._id !== requestId);
        console.log(`Removed sent request ${requestId}, new count: ${filtered.length}`);
        return filtered;
      });

      // Show success message
      Alert.alert('Request Cancelled', 'Friend request has been cancelled.');

      return response.data;
    } catch (err: any) {
      console.error('Error canceling friend request:', err);
      setError(err.response?.data?.message || 'Failed to cancel friend request');

      // Show error alert
      Alert.alert('Error', err.response?.data?.message || 'Failed to cancel friend request');

      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced remove friend with alerts
  const removeFriend = async (friendId: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Removing friend: ${friendId}`);
      const response = await api.delete(`/friends/${friendId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      console.log('Friend removed successfully');

      // Remove from friends list immediately
      setFriends(prev => prev.filter(friend => friend !== friendId));

      // Show success message
      Alert.alert('Friend Removed', 'Friend has been removed from your friends list.');

      return response.data;
    } catch (err: any) {
      console.error('Error removing friend:', err);
      setError(err.response?.data?.message || 'Failed to remove friend');

      // Show error alert
      Alert.alert('Error', err.response?.data?.message || 'Failed to remove friend');

      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <FriendContext.Provider
      value={{
        friends,
        receivedRequests,
        sentRequests,
        loading,
        error,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        cancelFriendRequest,
        removeFriend,
        refreshFriendData,
        getFriendStatus,
      }}
    >
      {children}
    </FriendContext.Provider>
  );
};

// Custom hook to use the friend context
export const useFriends = () => useContext(FriendContext);

// src/context/FriendRequestContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  friends: Friend[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  loading: boolean;
  error: string | null;
  getFriendStatus: (userId: string) => {
    status: FriendStatus;
    requestId?: string;
  };

  sendFriendRequest: (email: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  refreshFriendData: () => Promise<void>;
};


// Create the context
const FriendContext = createContext<FriendContextType>({
  friends: [],
  receivedRequests: [],
  sentRequests: [],
  loading: false,
  error: null,
  sendFriendRequest: async () => { },
  acceptFriendRequest: async () => { },
  rejectFriendRequest: async () => { },
  cancelFriendRequest: async () => { },
  removeFriend: async () => { },
  refreshFriendData: async () => { },
  getFriendStatus: () => ({ status: FriendStatus.NONE }),
});

// Create the provider component
export const FriendProvider = ({ children }: { children: React.ReactNode }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, authToken } = useAuth();
  const { socket } = useSocket();

  // Function to fetch all friend data
  const refreshFriendData = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch friend s list
      const friendsResponse = await api.get('/friends', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setFriends(friendsResponse.data.friends);
      console.log('Friends:', friends);

      // Fetch pending friend requests
      const pendingResponse = await api.get('/friends/requests/received', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setReceivedRequests(pendingResponse.data.requests);
      console.log('Received Requests:', receivedRequests);

      // Fetch sent friend requests
      const sentResponse = await api.get('/friends/requests/sent', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log('Sent requests:', sentRequests);

      setSentRequests(sentResponse.data.requests);
    } catch (err: any) {
      console.error('Error fetching friend data:', err);
      setError(err.response?.data?.message || 'Failed to fetch friend data');
    } finally {
      setLoading(false);
    }
  };

  const getFriendStatus = (userId: string): { status: FriendStatus; requestId?: string } => {
    // Safety check for userId
    if (!userId) {
      return { status: FriendStatus.NONE };
    }

    // Check if the user is already a friend
    // Look for both _id and id properties to handle all cases
    const friend = friends.find(f => f && (f._id === userId || (f as any).id === userId));
    if (friend) {
      return { status: FriendStatus.FRIENDS };
    }

    // Check if there's a pending sent request - handle both id and _id
    const sent = sentRequests.find(req =>
      req &&
      req.receiver &&
      typeof req.receiver === 'object' &&
      (('_id' in req.receiver && req.receiver._id === userId) ||
        ('id' in req.receiver && (req.receiver as any).id === userId))
    );
    if (sent) {
      return { status: FriendStatus.PENDING, requestId: sent._id };
    }

    // Check if there's an incoming request - handle both id and _id
    const received = receivedRequests.find(req =>
      req &&
      req.sender &&
      typeof req.sender === 'object' &&
      (('_id' in req.sender && req.sender._id === userId) ||
        ('id' in req.sender && (req.sender as any).id === userId))
    );
    if (received) {
      return { status: FriendStatus.INCOMING_REQUEST, requestId: received._id };
    }

    // If none of the above, no relationship exists
    return { status: FriendStatus.NONE };
  };



  // Load friend data on component mount or when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshFriendData();
    }
  }, [isAuthenticated]);

  // Listen for friend-related socket events
  useEffect(() => {
    if (!socket) return;

    // Listen for new friend requests
    socket.on('friend_request', data => {
      // Add the new request to pending requests
      setReceivedRequests(prev => [data, ...prev]);
    });

    socket.on('friend_request_canceled', data => {
      // Remove the canceled request from pending requests
      setReceivedRequests(prev => prev.filter(req => req._id !== data._id));
    });

    // Listen for accepted friend requests
    socket.on('friend_accepted', data => {
      // Move the accepted request from sent to friends
      setSentRequests(prev => prev.filter(req => req._id !== data._id));
      // Add the new friend to friends list if they're not already there
      setFriends(prev => {
        if (!prev.some(friend => friend._id === data.user._id)) {
          return [...prev, data.user];
        }
        return prev;
      });
    });

    // Listen for rejected friend requests
    socket.on('friend_rejected', data => {
      // Remove the rejected request from sent requests
      setSentRequests(prev => prev.filter(req => req._id !== data._id));
    });

    // Listen for friend removed events
    socket.on('friend_removed', data => {
      // Remove friend from list
      setFriends(prev => prev.filter(friend => friend._id !== data._id));
    });

    // Clean up listeners on unmount
    return () => {
      socket.off('friend_request');
      socket.off('friend_accepted');
      socket.off('friend_rejected');
      socket.off('friend_removed');
    };
  }, [socket]);

  // Send a friend request
  const sendFriendRequest = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(
        `/friends/requests/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      // Add the new request to the sent requests list
      setSentRequests(prev => [...prev, response.data.request]);
      return response.data;
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      setError(err.response?.data?.message || 'Failed to send friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Accept a friend request
  const acceptFriendRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/friends/requests/${requestId}/accept`,
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
        return response.data;
      }

      // Remove from pending requests immediately
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));

      // Add to friends list if not already there
      const senderId = acceptedRequest.sender._id;
      setFriends(prev => {
        if (!prev.some(friend => friend._id === senderId)) {
          return [...prev, acceptedRequest.sender];
        }
        return prev;
      });

      return response.data;
    } catch (err: any) {
      console.error('Error accepting friend request:', err);
      setError(err.response?.data?.message || 'Failed to accept friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  };


  // Reject a friend request
  const rejectFriendRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.put(`/friends/requests/${requestId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      // Remove from pending requests
      setReceivedRequests(prev => prev.filter(req => req._id !== requestId));
      return response.data;
    } catch (err: any) {
      console.error('Error rejecting friend request:', err);
      setError(err.response?.data?.message || 'Failed to reject friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel a sent friend request
  const cancelFriendRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/friends/requests/${requestId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Remove from sent requests
      setSentRequests(prev => prev.filter(req => req._id !== requestId));
      return response.data;
    } catch (err: any) {
      console.error('Error canceling friend request:', err);
      setError(err.response?.data?.message || 'Failed to cancel friend request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove a friend
  const removeFriend = async (friendId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.delete(`/friends/${friendId}`);
      // Remove from friends list
      setFriends(prev => prev.filter(friend => friend._id !== friendId));
      return response.data;
    } catch (err: any) {
      console.error('Error removing friend:', err);
      setError(err.response?.data?.message || 'Failed to remove friend');
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

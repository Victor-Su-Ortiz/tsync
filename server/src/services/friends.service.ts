import User from '../models/user.model';
// import { Types } from 'mongoose';
import { NotFoundError, ValidationError } from '../utils/errors';
import { FriendRequestResponse, PublicUser } from '../types/user.types';

export class FriendService {
  /**
   * Get all friends of a user
   */
  public static async getFriends(userId: string): Promise<PublicUser[]> {
    const user = await User.findById(userId)
      .populate('friends', 'name email profilePicture');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.friends as unknown as PublicUser[];
  }

  /**
   * Get all pending friend requests for a user
   */
  public static async getPendingRequests(userId: string): Promise<FriendRequestResponse[]> {
    const user = await User.findById(userId)
      .populate('friendRequests.from', 'name email profilePicture');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Filter pending requests and format them
    const pendingRequests = user.friendRequests
      .filter(request => request.status === 'pending')
      .map(request => ({
        _id: request._id.toString(),
        from: request.from as unknown as PublicUser,
        status: request.status,
        createdAt: request.createdAt.toISOString()
      }));

    return pendingRequests;
  }

  /**
   * Send a friend request to another user
   */
  public static async sendRequest(
    senderId: string, 
    receiverId: string
  ): Promise<{ success: boolean; message: string }> {
    
    const user = await User.findById(senderId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    user.sendFriendRequest(receiverId);
    return {
      success: true,
      message: 'Friend request sent successfully'
    };
  }

  /**
   * Accept a friend request
   */
  public static async acceptRequest(
    userId: string, 
    requestId: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

   user.acceptFriendRequest(requestId);

    return {
      success: true,
      message: 'Friend request accepted successfully'
    };
  }

  /**
   * Reject a friend request
   */
  public static async rejectRequest(
    userId: string, 
    requestId: string
  ): Promise<{ success: boolean; message: string }> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.rejectFriendRequest(requestId);

    return {
      success: true,
      message: 'Friend request rejected successfully'
    };
  }

  /**
   * Remove a friend
   */
  public static async removeFriend(
    userId: string, 
    friendId: string
  ): Promise<{ success: boolean; message: string }> {
    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId)
    ]);

    if (!user || !friend) {
      throw new NotFoundError('User not found');
    }

    // Check if they are actually friends
    if (!user.friends.includes(friend._id)) {
      throw new ValidationError('Not friends with this user');
    }

    user.removeFriend(friendId);

    return {
      success: true,
      message: 'Friend removed successfully'
    };
  }
}
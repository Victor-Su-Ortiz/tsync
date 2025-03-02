import User from '../models/user.model';
import { Types } from 'mongoose';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
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
    // Validate users
    if (senderId === receiverId) {
      throw new ValidationError('Cannot send friend request to yourself');
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      throw new NotFoundError('User not found');
    }

    // Check if already friends
    if (sender.friends.includes(receiver._id)) {
      throw new ValidationError('Already friends with this user');
    }

    // Check if request already exists
    const existingRequest = receiver.friendRequests.find(
      req => req.from.toString() === senderId && ['pending', 'accepted'].includes(req.status)
    );

    if (existingRequest) {
      throw new ValidationError('Friend request already sent');
    }

    // Check if user is blocked
    if (receiver.blockedUsers.includes(sender._id)) {
      throw new ForbiddenError('Cannot send friend request to this user');
    }

    // Add friend request to target user
    receiver.friendRequests.push({
      _id: new Types.ObjectId(),
      from: sender._id,
      status: 'pending',
      createdAt: new Date()
    });

    await receiver.save();

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

    // Find the request
    const requestIndex = user.friendRequests.findIndex(
      req => req._id.toString() === requestId
    );

    if (requestIndex === -1) {
      throw new NotFoundError('Friend request not found');
    }

    const request = user.friendRequests[requestIndex];

    if (request.status !== 'pending') {
      throw new ValidationError('This request has already been processed');
    }

    // Update request status
    user.friendRequests[requestIndex].status = 'accepted';

    // Add to friends list (for both users)
    if (!user.friends.includes(request.from)) {
      user.friends.push(request.from);
    }
    
    // Add current user to the friend's friends list
    await User.findByIdAndUpdate(request.from, {
      $addToSet: { friends: user._id }
    });

    await user.save();

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

    // Find the request
    const requestIndex = user.friendRequests.findIndex(
      req => req._id.toString() === requestId
    );

    if (requestIndex === -1) {
      throw new NotFoundError('Friend request not found');
    }

    const request = user.friendRequests[requestIndex];

    if (request.status !== 'pending') {
      throw new ValidationError('This request has already been processed');
    }

    // Update request status
    user.friendRequests[requestIndex].status = 'rejected';
    await user.save();

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

    // Remove from both users' friend lists
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $pull: { friends: friendId }
      }),
      User.findByIdAndUpdate(friendId, {
        $pull: { friends: userId }
      })
    ]);

    return {
      success: true,
      message: 'Friend removed successfully'
    };
  }
}
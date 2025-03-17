import User from '../models/user.model';
import FriendRequest from '../models/friendRequest.model';
import { Types, Document } from 'mongoose';
import { NotFoundError, ValidationError, BadRequestError } from '../utils/errors';
import { PublicUser } from '../types/user.types';
import { IFriendRequest } from '../types/friendRequest.types';


export class FriendService {
  /**
   * Check if a friend request already exists between users
   * @param senderId ID of the user who sent the request
   * @param receiverId ID of the user who received the request
   * @returns Boolean indicating if a request exists and its status
   */
  public static async checkFriendRequestExists(senderId: string, receiverId: string): Promise<{ exists: boolean, status?: string, receiver?: string, sender?: string }> {
    try {
      // Validate IDs
      if (!Types.ObjectId.isValid(senderId) || !Types.ObjectId.isValid(receiverId)) {
        throw new BadRequestError('Invalid user ID');
      }

      // Check if the request exists
      const request = await FriendRequest.findBetweenUsers(senderId, receiverId);
      if (!request) {
        return { exists: false };
      }

      return { exists: true, status: request.status, receiver: request.receiver.toString() , sender: request.sender.toString() };
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      throw new Error(`Error checking friend request: ${error}`);
    }
  }

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
   * Get all sent friend requests
   */
  public static async getSentRequests(userId: string): Promise<(IFriendRequest & Document)[]> {
    const requests = await FriendRequest.find({
      sender: userId
    }).populate('receiver', 'name email profilePicture');

    if (!requests || requests.length === 0) {
      return [];
    }

    return requests;
  }
  /**
   * Get all sent requests that are pending
   */
  public static async getSentPendingRequests(userId: string): Promise<(IFriendRequest & Document)[]> {
    const pendingRequests = await FriendRequest.find({
      sender: userId,
      status: 'pending'
    }).populate('receiver', 'name email profilePicture');

    if (!pendingRequests || pendingRequests.length === 0) {
      return []; // Return an empty array instead of throwing an error
    }

    // Format the requests into the response format
    return pendingRequests;
  }

  /**
   * Get all incoming requests
   * */
  public static async getReceivedRequests(userId: string): Promise<(IFriendRequest & Document)[]> {
    const requests = await FriendRequest.find({
      receiver: userId
    }).populate('sender', 'name email profilePicture');

    if (!requests || requests.length === 0) {
      return [];
    }

    return requests;
  }

  /**
   * Get all incoming requests that are pending
   */
  public static async getReceivedPendingRequests(userId: string): Promise<(IFriendRequest & Document)[]> {
    const pendingRequests = await FriendRequest.find({
      receiver: userId, 
      status: 'pending'
    }).populate('sender', 'name email profilePicture');

    if (!pendingRequests || pendingRequests.length === 0) {
      return []; // Return an empty array instead of throwing an error
    }

    // Format the requests into the response format
    return pendingRequests
  }

  /**
   * Send a friend request to another user
   */
  public static async sendRequest(
    senderId: string,
    receiverId: string
  ): Promise<{ success: boolean; message: string, friendRequest: IFriendRequest }> {

    const user = await User.findById(senderId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const friendRequest = await user.sendFriendRequest(receiverId);
    return {
      success: true,
      message: 'Friend request sent successfully',
      friendRequest
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
import { Request, Response, NextFunction } from 'express';
import { FriendService } from '../services/friends.service';
// import User from '../models/user.model';

export class FriendController {

  /**
   * Check if a friend request exists between users
   * returns a boolean indicating if a request exists and its status
   */
  static async checkPendingRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { senderId } = req.params;
      const receiverId = req.userId; // From auth middleware
      const result = await FriendService.checkFriendRequestExists(senderId, receiverId!.toString());
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if a friend request exists between users
   * returns a boolean indicating if a request exists and its status
   */
  static async checkFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { receiverId } = req.params;
      const senderId = req.userId; // From auth middleware

      const result = await FriendService.checkFriendRequestExists(senderId!.toString(), receiverId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all friends of the current user
   */
  static async getFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const friends = await FriendService.getFriends(req.userId!.toString());
      res.status(200).json({
        success: true,
        friends
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all pending friend requests for the current user
   */
  static async getPendingRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await FriendService.getPendingRequests(req.userId!.toString());
      res.status(200).json({
        success: true,
        requests
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send a friend request to another user
   */
  static async sendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await FriendService.sendRequest(req.userId!.toString(), userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept a friend request
   */
  static async acceptRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const result = await FriendService.acceptRequest(req.userId!.toString(), requestId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a friend request
   */
  static async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const result = await FriendService.rejectRequest(req.userId!.toString(), requestId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a friend
   */
  static async removeFriend(req: Request, res: Response, next: NextFunction) {
    try {
      const { friendId } = req.params;
      const result = await FriendService.removeFriend(req.userId!.toString(), friendId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
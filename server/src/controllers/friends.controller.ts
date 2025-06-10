import { Request, Response, NextFunction } from 'express';
import { IFriendService } from '../types/services-types/friend.service.types';

export class FriendController {
  /**
   * Check if a friend request exists between users
   * returns a boolean indicating if a request exists and its status
   */
  friendService: IFriendService;
  constructor(friendService: IFriendService) {
    this.friendService = friendService;
  }
  async checkFriendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const senderId = req.userId; // From auth middleware

      const result = await this.friendService.checkFriendRequestExists(
        senderId!.toString(),
        userId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all friends of the current user
   */
  async getFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const friends = await this.friendService.getFriends(req.userId!.toString());
      res.status(200).json({
        success: true,
        friends,
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get all sent friend requests for the current user
   */
  async getSentRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await this.friendService.getSentRequests(req.userId!.toString());
      res.status(200).json({
        success: true,
        requests,
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get all sent pending friend requests for the current user
   */
  async getSentPendingRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await this.friendService.getSentPendingRequests(req.userId!.toString());
      res.status(200).json({
        success: true,
        requests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all received friend requests for the current user
   */
  async getReceivedRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await this.friendService.getReceivedRequests(req.userId!.toString());
      res.status(200).json({
        success: true,
        requests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all received pending friend requests for the current user
   */
  async getReceivedPendingRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await this.friendService.getReceivedPendingRequests(req.userId!.toString());
      res.status(200).json({
        success: true,
        requests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send a friend request to another user
   */
  async sendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const result = await this.friendService.sendRequest(req.userId!.toString(), userId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Accept a friend request
   */
  async acceptRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const result = await this.friendService.acceptRequest(req.userId!.toString(), requestId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async cancelRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const result = await this.friendService.cancelRequest(req.userId!.toString(), requestId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject a friend request
   */
  async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;
      const result = await this.friendService.rejectRequest(req.userId!.toString(), requestId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a friend
   */
  async removeFriend(req: Request, res: Response, next: NextFunction) {
    try {
      const { friendId } = req.params;
      const result = await this.friendService.removeFriend(req.userId!.toString(), friendId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

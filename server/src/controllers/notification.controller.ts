// src/controllers/notification.controller.ts
import { Request, Response, NextFunction } from 'express';
import NotificationService from '../services/notification.service';
import { ValidationError } from '../utils/errors';

export class NotificationController {
  /**
   * Get user's notifications
   */
  static async getUserNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, unreadOnly } = req.query;
      
      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        unreadOnly: unreadOnly === 'true'
      };

      const result = await NotificationService.getUserNotifications(
        req.userId!.toString(),
        options
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { notificationIds } = req.body;
      
      // Validate notificationIds if provided
      if (notificationIds && !Array.isArray(notificationIds)) {
        throw new ValidationError('notificationIds must be an array');
      }

      const result = await NotificationService.markAsRead(
        req.userId!.toString(),
        notificationIds
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notifications
   */
  static async deleteNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { notificationIds } = req.body;
      
      // Validate notificationIds
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new ValidationError('notificationIds must be a non-empty array');
      }

      const result = await NotificationService.deleteNotifications(
        req.userId!.toString(),
        notificationIds
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default NotificationController;
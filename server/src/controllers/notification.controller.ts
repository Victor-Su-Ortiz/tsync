// src/controllers/notification.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import { INotificationService } from '../types/services/notification.service.types';

export class NotificationController {
  notificationService: INotificationService;
  constructor(notificationService: INotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Get user's notifications
   */
  getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, unreadOnly } = req.query;

      const options = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        unreadOnly: unreadOnly === 'true',
      };

      const result = await this.notificationService.getUserNotifications(
        req.userId!.toString(),
        options
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark notifications as read
   */
  markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { notificationIds } = req.body;

      // Validate notificationIds if provided
      if (notificationIds && !Array.isArray(notificationIds)) {
        throw new ValidationError('notificationIds must be an array');
      }

      const result = await this.notificationService.markAsRead(
        req.userId!.toString(),
        notificationIds
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete notifications
   */
  deleteNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { notificationIds } = req.body;

      // Validate notificationIds
      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        throw new ValidationError('notificationIds must be a non-empty array');
      }

      const result = await this.notificationService.deleteNotifications(
        req.userId!.toString(),
        notificationIds
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default NotificationController;

import Notification from '../models/notification.model';
import socketService from './socket.service';
import { Types } from 'mongoose';
import {
  CreateNotificationDto,
  INotificationService,
} from '../types/services/notification.service.types';

export class NotificationService implements INotificationService {
  /**
   * Create a new notification and send it in real-time if recipient is online
   */
  public async createNotification(notificationData: CreateNotificationDto): Promise<any> {
    try {
      // Convert string IDs to ObjectIds
      const data = {
        recipient: new Types.ObjectId(notificationData.recipientId),
        sender: new Types.ObjectId(notificationData.senderId),
        type: notificationData.type,
        message: notificationData.message,
        relatedId: notificationData.relatedId
          ? new Types.ObjectId(notificationData.relatedId)
          : undefined,
        onModel: notificationData.onModel,
        read: false,
      };

      // Save notification to database
      const notification = await Notification.create(data);

      // Populate sender info for the real-time notification
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'name profilePicture')
        .lean();

      // Send real-time notification if user is online
      socketService.sendToUser(notificationData.recipientId, 'notification', populatedNotification);

      return populatedNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  public async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    } = {}
  ): Promise<any> {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const query = { recipient: new Types.ObjectId(userId), read: true };
    if (unreadOnly) {
      query['read'] = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profilePicture')
      .populate('relatedId')
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: new Types.ObjectId(userId),
      read: false,
    });

    return {
      notifications,
      pagination: {
        total,
        unreadCount,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark notifications as read
   */
  public async markAsRead(
    userId: string,
    notificationIds?: string[]
  ): Promise<{ success: boolean; unreadCount: number }> {
    const updateQuery = notificationIds?.length
      ? { recipient: userId, _id: { $in: notificationIds.map(id => new Types.ObjectId(id)) } }
      : { recipient: userId };

    await Notification.updateMany(updateQuery, { read: true });

    const unreadCount = await Notification.countDocuments({
      recipient: new Types.ObjectId(userId),
      read: false,
    });

    return { success: true, unreadCount };
  }

  /**
   * Delete notifications
   */
  public async deleteNotifications(
    userId: string,
    notificationIds: string[]
  ): Promise<{ success: boolean }> {
    await Notification.deleteMany({
      recipient: new Types.ObjectId(userId),
      _id: { $in: notificationIds.map(id => new Types.ObjectId(id)) },
    });

    return { success: true };
  }
}

export default NotificationService;

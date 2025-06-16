import { EventType } from '../../utils/enums';
export interface CreateNotificationDto {
  recipientId: string;
  senderId: string;
  type: EventType;
  message: string;
  relatedId?: string;
  onModel?: 'User' | 'FriendRequest' | 'Event';
}

export interface INotificationService {
  createNotification(notificationData: CreateNotificationDto): Promise<any>;
  getUserNotifications(
    userId: string,
    options?: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
    }
  ): Promise<any>;
  markAsRead(
    userId: string,
    notificationIds?: string[]
  ): Promise<{ success: boolean; unreadCount: number }>;
  deleteNotifications(userId: string, notificationIds: string[]): Promise<{ success: boolean }>;
}

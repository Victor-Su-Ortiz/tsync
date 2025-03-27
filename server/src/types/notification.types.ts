import { Types } from 'mongoose';
export interface INotification {
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: string;
  message: string;
  relatedId?: Types.ObjectId; // ID of related entity (friend request, etc.)
  onModel?: string; // Model of related entity
  read: boolean;
  createdAt: Date;
}

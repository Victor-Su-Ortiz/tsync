// src/models/notification.model.ts
import mongoose, { Schema, Types } from "mongoose";

export interface INotification {
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: string;
  message: string;
  relatedId?: Types.ObjectId; // ID of related entity (friend request, etc.)
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ["FRIEND_REQUEST", "FRIEND_ACCEPTED", "MEETING_INVITE", "MEETING_UPDATE", "SYSTEM"]
    },
    message: {
      type: String,
      required: true
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      refPath: "onModel"
    },
    onModel: {
      type: String,
      enum: ["User", "FriendRequest", "Meeting"]
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Create an index for querying recent unread notifications
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
// src/models/notification.model.ts
import mongoose, { Schema } from "mongoose";
import { INotification } from "../types/notification.types";
import { EventType } from "../utils/enums";


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
      enum: EventType
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
      enum: ["User", "FriendRequest", "Event"]
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
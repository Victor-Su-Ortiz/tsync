import mongoose, { Schema, Types, Model } from 'mongoose';
import {IFriendRequest} from '../types/friendRequest.types';

const friendRequestSchema = new Schema<IFriendRequest>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Create a compound index for sender+receiver to ensure uniqueness
// This prevents duplicate friend requests between the same users
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

// Static method to check if a request exists between users
friendRequestSchema.statics.findBetweenUsers = async function (
  senderId: string | Types.ObjectId,
  receiverId: string | Types.ObjectId
) {
  return this.findOne({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId }
    ]
  });
};

// Define the model interface with static methods
interface FriendRequestModel extends Model<IFriendRequest> {
  findBetweenUsers(
    senderId: string | Types.ObjectId,
    receiverId: string | Types.ObjectId
  ): Promise<IFriendRequest | null>;
}

const FriendRequest = mongoose.model<IFriendRequest, FriendRequestModel>(
  'FriendRequest',
  friendRequestSchema
);

export default FriendRequest;
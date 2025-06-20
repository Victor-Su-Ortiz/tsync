import mongoose, { Schema, Types, Model } from 'mongoose';
import { IFriendRequest } from '../types/models/friendRequest.types';
import { FriendRequestStatus } from '../utils/enums';

const friendRequestSchema = new Schema<IFriendRequest>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(FriendRequestStatus),
      default: FriendRequestStatus.PENDING,
      index: true,
    },
  },
  {
    timestamps: true,
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
      { sender: senderId, receiver: receiverId, status: FriendRequestStatus.PENDING },
      { sender: receiverId, receiver: senderId, status: FriendRequestStatus.PENDING },
    ],
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

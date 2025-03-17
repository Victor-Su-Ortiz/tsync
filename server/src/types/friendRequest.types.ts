import { Types } from 'mongoose';

export interface IFriendRequest extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}
import { Types } from 'mongoose';
import { FriendRequestStatus } from '../../utils/enums';

export interface IFriendRequest extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}

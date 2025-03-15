import { Types } from 'mongoose';

// Friend request interface ORIGINAL
// export interface IFriendRequest {
//     _id: Types.ObjectId;
//     // friendId who sent the request
//     from: Types.ObjectId;
//     status: 'pending' | 'accepted' | 'rejected';
//     createdAt: Date;
//   }

export interface IFriendRequest extends Document {
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  _id: Types.ObjectId;
}
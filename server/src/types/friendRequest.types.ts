import { Types } from 'mongoose';

// Friend request interface
export interface IFriendRequest {
    _id: Types.ObjectId;
    // friendId who sent the request
    from: Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
  }

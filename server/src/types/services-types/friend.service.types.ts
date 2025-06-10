import { IFriendRequest } from '../../types/friendRequest.types';
import { PublicUser } from '../../types/user.types';

export interface IFriendService {
  checkFriendRequestExists(
    senderId: string,
    receiverId: string
  ): Promise<{
    exists: boolean;
    status?: string;
    receiver?: string;
    sender?: string;
  }>;
  getFriends(userId: string): Promise<PublicUser[]>;
  getSentRequests(userId: string): Promise<(IFriendRequest & Document)[]>;
  getSentPendingRequests(userId: string): Promise<(IFriendRequest & Document)[]>;
  getReceivedRequests(userId: string): Promise<(IFriendRequest & Document)[]>;
  getReceivedPendingRequests(userId: string): Promise<(IFriendRequest & Document)[]>;
  sendRequest(
    senderId: string,
    receiverId: string
  ): Promise<{
    success: boolean;
    message: string;
    friendRequest: IFriendRequest;
  }>;
  acceptRequest(
    userId: string,
    requestId: string
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  cancelRequest(
    userId: string,
    requestId: string
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  rejectRequest(
    userId: string,
    requestId: string
  ): Promise<{
    success: boolean;
    message: string;
  }>;
  removeFriend(
    userId: string,
    friendId: string
  ): Promise<{
    success: boolean;
    message: string;
  }>;
}

// Define as an enum instead of a union type
export enum FriendEventType {
  FRIEND_REQUEST_RECEIVED = 'FRIEND_REQUEST_RECEIVED',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  FRIEND_REJECTED = 'FRIEND_REJECTED',
  FRIEND_REMOVED = 'FRIEND_REMOVED',
  FRIEND_REQUEST_CANCELED = 'FRIEND_REQUEST_CANCELED',
}

// Define an enum for the request status
export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum EventType {
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  MEETING_INVITE = 'MEETING_INVITE',
  MEETING_UPDATE = 'MEETING_UPDATE',
  SYSTEM = 'SYSTEM',
}

// Define an enum for the request status
export enum FriendStatus {
  NONE = 'none',
  PENDING = 'pending',
  FRIENDS = 'friends',
  INCOMING_REQUEST = 'incoming_request',
}

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum FriendRequestEventType {
  FRIEND_REQUEST_RECEIVED = 'FRIEND_REQUEST_RECEIVED',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  FRIEND_REJECTED = 'FRIEND_REJECTED',
  FRIEND_REMOVED = 'FRIEND_REMOVED',
  FRIEND_REQUEST_CANCELED = 'FRIEND_REQUEST_CANCELED'
}

export enum NotificationType {
  MEETING_INVITE = 'MEETING_INVITE',
  FRIEND_ACCEPTED = 'FRIEND_ACCEPTED',
  FRIEND_REQUEST = 'FRIEND_REQUEST'
}
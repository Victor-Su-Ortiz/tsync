// src/models/User.ts
import mongoose, { Types, Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, IUserMethods, IUserModel, PublicUser } from "../types/user.types";
import { IFriendRequest } from "../types/friendRequest.types";
import FriendRequest from "./friendRequest.model"; // Import the FriendRequest model
import { FriendEventType, FriendRequestStatus } from "../utils/enums";

const userSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
        },
        message: (props: any) => `${props.value} is not a valid email address!`,
      },
      index: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin"],
        message: "{VALUE} is not a valid role",
      },
      default: "user",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null/undefined values to be unique
      index: true,
    },
    googleRefreshToken: {
      type: String,
      select: false,
    },
    isGoogleCalendarConnected: {
      type: Boolean,
      default: false,
    },
    googleTokenExpiry: {
      type: Date,
    },
    googleCalendarSyncEnabled: {
      type: Boolean,
      default: true,
    },
    profilePicture: {
      type: String,
      default: "default-avatar.png",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: {
      type: Date,
      default: null,
    },
    friends: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],

    blockedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    }]
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to get all friend requests sent by this user
userSchema.virtual('sentFriendRequests', {
  ref: 'FriendRequest',
  localField: '_id',
  foreignField: 'sender'
});

// Virtual field to get all friend requests received by this user
userSchema.virtual('receivedFriendRequests', {
  ref: 'FriendRequest',
  localField: '_id',
  foreignField: 'receiver'
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash password if it has been modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

// Method to get public profile (exclude sensitive data)
userSchema.methods.getPublicProfile = function (): PublicUser {
  const userObject = this.toObject();
  // Remove sensitive fields
  const {
    password,
    verificationToken,
    resetPasswordToken,
    resetPasswordExpire,
    blockedUsers,
    ...publicData
  } = userObject;

  return publicData;
};

// Updated friend-related methods to use the new FriendRequest model
// Make sure these methods match the IUserMethods interface return types
userSchema.methods.sendFriendRequest = async function (friendId: string): Promise<IFriendRequest & Document> {
  if (this._id.toString() === friendId) {
    throw new Error('Cannot send friend request to self');
  }

  // Check if already friends
  if (this.friends.some((id: Types.ObjectId) => id.toString() === friendId)) {
    throw new Error('Already friends with this user');
  }

  // Check if blocked
  if (this.blockedUsers.some((id: Types.ObjectId) => id.toString() === friendId) ||
    (await User.findById(friendId))?.blockedUsers.includes(this._id)) {
    throw new Error('Unable to send friend request');
  }

  // Check for existing request using the findBetweenUsers static method
  const existingRequest = await FriendRequest.findBetweenUsers(this._id, friendId);
  if (existingRequest) {
    throw new Error('Friend request already exists between users');
  }
  // check if there is a rejected friend request
  let friendRequest = await FriendRequest.findOne({
    sender: this._id,
    receiver: friendId,
    status: FriendRequestStatus.REJECTED
  });

  // If there is a rejected request, update it to pending
  if (friendRequest) {
    friendRequest.status = FriendRequestStatus.PENDING;
    await friendRequest.save();
  } else {
    // Create a new friend request
    friendRequest = new FriendRequest({
      sender: this._id,
      receiver: friendId,
      status: FriendRequestStatus.PENDING
    });

    await friendRequest.save();
  }

  

  // Create notification
  const { default: NotificationService } = await import('../services/notification.service');
  await NotificationService.createNotification({
    recipientId: friendId,
    senderId: this._id.toString(),
    type: 'FRIEND_REQUEST',
    message: `${this.name} sent you a friend request`,
    relatedId: friendRequest._id ? friendRequest._id.toString() : friendRequest.id,
    onModel: 'FriendRequest'
  });

  const { default: SocketService } = await import('../services/socket.service');
  SocketService.sendToUser(friendId, 'friend_request_status_changed', {event: FriendEventType.FRIEND_REQUEST_RECEIVED, data: friendRequest});

  return friendRequest;
};

/**
 * Cancel a friend request
 */
userSchema.methods.cancelFriendRequest = async function (requestId: string): Promise<void> {
  const request = await FriendRequest.findOne({
    _id: requestId
  });

  if (!request) {
    throw new Error('Invalid friend request');
  }

  await FriendRequest.deleteOne({ _id: requestId });
  
  const { default: SocketService } = await import('../services/socket.service');
  SocketService.sendToUser(request.receiver.toString(), 'friend_request_status_changed', {event: FriendEventType.FRIEND_REQUEST_CANCELED, data: request});
}

userSchema.methods.acceptFriendRequest = async function (requestId: string): Promise<void> {
  const request = await FriendRequest.findOne({
    _id: requestId,
    receiver: this._id,
    status: FriendRequestStatus.PENDING
  });

  if (!request) {
    throw new Error('Invalid friend request');
  }

  // Update request status
  request.status = FriendRequestStatus.ACCEPTED;
  await request.save();

  // Add to friends list for both users
  this.friends.push(request.sender);
  await User.findByIdAndUpdate(request.sender, {
    $push: { friends: this._id }
  });

  await this.save();

  // Create notification for the request sender
  const { default: NotificationService } = await import('../services/notification.service');
  await NotificationService.createNotification({
    recipientId: request.sender.toString(),
    senderId: this._id.toString(),
    type: 'FRIEND_ACCEPTED',
    message: `${this.name} accepted your friend request`,
    relatedId: request._id ? request._id.toString() : request.id,
    onModel: 'FriendRequest'
  });

  const { default: SocketService } = await import('../services/socket.service');
  SocketService.sendToUser(request.sender.toString(), 'friend_request_status_changed', {event: FriendEventType.FRIEND_ACCEPTED, data: request});
};

userSchema.methods.rejectFriendRequest = async function (requestId: string): Promise<void> {
  const request = await FriendRequest.findOne({
    _id: requestId,
    receiver: this._id,
    status: FriendRequestStatus.PENDING
  });

  if (!request) {
    throw new Error('Invalid friend request');
  }

  request.status = FriendRequestStatus.REJECTED;
  await request.save();
  const {default: SocketService} = await import('../services/socket.service');
  SocketService.sendToUser(request.sender.toString(), 'friend_request_status_changed', {event: FriendEventType.FRIEND_REJECTED, data:request});
};

userSchema.methods.removeFriend = async function (friendId: string) {
  if (!this.friends.some((id: Types.ObjectId) => id.toString() === friendId)) {
    throw new Error('User is not a friend');
  }

  // Remove from both users' friend lists
  this.friends = this.friends.filter(id => id.toString() !== friendId);
  await User.findByIdAndUpdate(friendId, {
    $pull: { friends: this._id }
  });

  await this.save();

  // Also find and remove any friend requests between these users
  await FriendRequest.deleteMany({
    $or: [
      { sender: this._id, receiver: friendId },
      { sender: friendId, receiver: this._id }
    ]
  });
};

// Helper method to get all pending friend requests
userSchema.methods.getPendingFriendRequests = async function (): Promise<(IFriendRequest & Document)[]> {
  return FriendRequest.find({
    receiver: this._id,
    status: FriendRequestStatus.PENDING
  });
};

// Static method to find user by email
userSchema.static("findByEmail", async function findByEmail(email: string) {
  return this.findOne({ email });
});

// Virtual for full name
userSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.name}`;
});

// Create the model
const User = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
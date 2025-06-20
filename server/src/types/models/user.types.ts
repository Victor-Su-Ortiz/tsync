import mongoose, { Document, Model, Types } from 'mongoose';
import { IFriendRequest } from './friendRequest.types';

export interface IPreference extends mongoose.Types.Subdocument {
  _id: Types.ObjectId;
  text: string;
  createdAt: Date;
  isActive: boolean;
}

// Interface to define the User document structure
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  googleId?: string;
  googleRefreshToken?: string;
  isGoogleCalendarConnected: boolean;
  googleTokenExpiry?: Date;
  googleCalendarSyncEnabled?: boolean;
  profilePicture?: string;
  isEmailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: IPreference[];
  // Friend-related fields
  friends: Types.ObjectId[];
  // List of blocked users
  blockedUsers: Types.ObjectId[];
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  getPublicProfile(): PublicUser;
  sendFriendRequest(friendId: string): Promise<IFriendRequest & Document>;
  acceptFriendRequest(requestId: string): Promise<void>;
  rejectFriendRequest(requestId: string): Promise<void>;
  removeFriend(friendId: string): Promise<void>;
  getPendingFriendRequests(): Promise<(IFriendRequest & Document)[]>;
  cancelFriendRequest(requestId: string): Promise<void>;

  // Preference Methods
  addPreference(preferenceText: string): Promise<IUser & Document>;
  updatePreference(preferenceId: string, newText: string): Promise<IUser & Document>;
  removePreference(preferenceId: string): Promise<IUser & Document>;
  togglePreferenceStatus(preferenceId: string): Promise<IUser & Document>;
  getActivePreferences(): string[];
}

// Public user data type (for API responses)
export type PublicUser = Omit<
  IUser,
  | 'password'
  | 'verificationToken'
  | 'resetPasswordToken'
  | 'resetPasswordExpire'
  | 'blockedUsers'
  | 'googleRefreshToken'
  | 'googleId'
>;

export interface IUserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<Document<unknown, any, IUser> & IUser & IUserMethods>;
}

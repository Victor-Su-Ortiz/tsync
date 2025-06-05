// import bcrypt from 'bcryptjs';
import { Document } from 'mongoose';

// Import your User model and interfaces
// Note: Adjust the import path based on your project structure
import User from '../../src/models/user.model';
import FriendRequest from '../../src/models/friendRequest.model';
import { IUser, IUserMethods } from '../../src/types/user.types';
import { FriendRequestStatus } from '../../src/utils/enums';
import { describe, it, afterEach, expect, beforeEach } from '@jest/globals';

describe('User Model Tests', () => {
  // Clear the database between tests
  afterEach(async () => {
    await User.deleteMany({});
    await FriendRequest.deleteMany({});
  });

  // Test user creation
  it('should create a new user successfully', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'user',
      isEmailVerified: false,
    };

    const user = await User.create(userData);

    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    // Password should be hashed
    expect(user.password).not.toBe(userData.password);
    expect(user.role).toBe(userData.role);
    expect(user.isEmailVerified).toBe(false);
    expect(user.friends).toEqual([]);
    expect(user.blockedUsers).toEqual([]);
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  // Test password comparison method
  it('should correctly validate password', async () => {
    const userData = {
      name: 'Password Test User',
      email: 'password-test@example.com',
      password: 'SecurePassword123!',
      role: 'user',
      isEmailVerified: false,
    };

    const user = await User.create(userData);

    // Test correct password
    const isMatch = await user.comparePassword('SecurePassword123!');
    expect(isMatch).toBe(true);

    // Test incorrect password
    const isNotMatch = await user.comparePassword('WrongPassword');
    expect(isNotMatch).toBe(false);
  });

  // Test findByEmail static method
  it('should find user by email', async () => {
    // Create a test user
    const userData = {
      name: 'Email Test User',
      email: 'find-by-email@example.com',
      password: 'Password123',
      role: 'user',
      isEmailVerified: true,
    };

    await User.create(userData);

    // Find the user by email
    const foundUser = await User.findByEmail('find-by-email@example.com');

    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe('find-by-email@example.com');
  });

  // Test getPublicProfile method
  it('should return public profile without sensitive information', async () => {
    const userData = {
      name: 'Public Profile User',
      email: 'public-profile@example.com',
      password: 'Password123',
      role: 'user',
      isEmailVerified: true,
      verificationToken: 'secret-token',
      resetPasswordToken: 'reset-token',
    };

    const user = await User.create(userData);
    const publicProfile = user.getPublicProfile();

    // Public profile should include these fields
    expect(publicProfile.name).toBe(userData.name);
    expect(publicProfile.email).toBe(userData.email);
    expect(publicProfile.role).toBe(userData.role);

    // Public profile should NOT include these sensitive fields
    expect('password' in publicProfile).toBe(false);
    expect('verificationToken' in publicProfile).toBe(false);
    expect('resetPasswordToken' in publicProfile).toBe(false);
    expect('resetPasswordExpire' in publicProfile).toBe(false);
    expect('blockedUsers' in publicProfile).toBe(false);
  });

  // Friend request tests
  describe('Friend Request Functionality', () => {
    let user1: Document<unknown, any, IUser> & IUser & IUserMethods;
    let user2: Document<unknown, any, IUser> & IUser & IUserMethods;

    beforeEach(async () => {
      // Create two users for friend request testing
      user1 = await User.create({
        name: 'User One',
        email: 'user1@example.com',
        password: 'Password123',
        role: 'user',
        isEmailVerified: true,
      });

      user2 = await User.create({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'Password123',
        role: 'user',
        isEmailVerified: true,
      });
    });

    it('should send friend request successfully', async () => {
      const request = await user1.sendFriendRequest(user2._id.toString());

      expect(request).toBeDefined();
      expect(request.sender._id.toString()).toBe(user1._id.toString());
      expect(request.receiver._id.toString()).toBe(user2._id.toString());
      expect(request.status).toBe(FriendRequestStatus.PENDING);

      // Verify the request exists in the database
      const foundRequest = await FriendRequest.findOne({
        sender: user1._id,
        receiver: user2._id,
        status: FriendRequestStatus.PENDING,
      });

      expect(foundRequest).toBeDefined();
    });

    it('should accept friend request successfully', async () => {
      // User1 sends request to User2
      const request = await user1.sendFriendRequest(user2._id.toString());

      // User2 accepts the request
      await user2.acceptFriendRequest(request._id.toString());

      // Reload both users
      const updatedUser2 = await User.findById(user2._id);
      const updatedUser1 = await User.findById(user1._id);

      // Check that they are now friends
      expect(updatedUser1?.friends).toContainEqual(user2._id);
      expect(updatedUser2?.friends).toContainEqual(user1._id);

      // Check that request status is updated
      const updatedRequest = await FriendRequest.findById(request._id);
      expect(updatedRequest?.status).toBe(FriendRequestStatus.ACCEPTED);
    });

    it('should reject friend request successfully', async () => {
      // User1 sends request to User2
      const request = await user1.sendFriendRequest(user2._id.toString());

      // User2 rejects the request
      await user2.rejectFriendRequest(request._id.toString());

      // Reload user2
      const updatedUser2 = await User.findById(user2._id);

      // Check that request status is updated
      const updatedRequest = await FriendRequest.findById(request._id);
      expect(updatedRequest?.status).toBe(FriendRequestStatus.REJECTED);

      // Check that they are not friends
      expect(updatedUser2?.friends).not.toContainEqual(user1._id);
    });

    it('should cancel friend request successfully', async () => {
      // User1 sends request to User2
      const request = await user1.sendFriendRequest(user2._id.toString());

      // User1 cancels the request
      await user1.cancelFriendRequest(request._id.toString());

      // Verify the request is deleted
      const deletedRequest = await FriendRequest.findById(request._id);
      expect(deletedRequest).toBeNull();
    });

    it('should remove friend successfully', async () => {
      // Setup: Make them friends first
      const request = await user1.sendFriendRequest(user2._id.toString());
      await user2.acceptFriendRequest(request._id.toString());

      // Reload user2 and remove friend
      const updatedUser2 = await User.findById(user2._id);
      await updatedUser2?.removeFriend(user1._id.toString());

      // Reload both users
      const finalUser2 = await User.findById(user2._id);
      const finalUser1 = await User.findById(user1._id);

      // Check that they are no longer friends
      expect(finalUser2?.friends).not.toContainEqual(user1._id);
      expect(finalUser1?.friends).not.toContainEqual(user2._id);

      // Check that all friend requests between them are deleted
      const anyRequests = await FriendRequest.find({
        $or: [
          { sender: user1._id, receiver: user2._id },
          { sender: user2._id, receiver: user1._id },
        ],
      });
      expect(anyRequests).toHaveLength(0);
    });

    it('should not allow duplicate friend requests', async () => {
      // Send initial request
      await user1.sendFriendRequest(user2._id.toString());

      // Try to send duplicate request
      await expect(async () => {
        await user1.sendFriendRequest(user2._id.toString());
      }).rejects.toThrow('Friend request already exists between users');
    });

    it('should not allow self friend requests', async () => {
      await expect(async () => {
        await user1.sendFriendRequest(user1._id.toString());
      }).rejects.toThrow('Cannot send friend request to self');
    });

    it('should handle rejected friend request resubmission', async () => {
      // User1 sends request to User2
      const request = await user1.sendFriendRequest(user2._id.toString());

      // User2 rejects the request
      await user2.rejectFriendRequest(request._id.toString());

      // User1 should be able to send another request
      const newRequest = await user1.sendFriendRequest(user2._id.toString());

      expect(newRequest).toBeDefined();
      expect(newRequest.status).toBe(FriendRequestStatus.PENDING);
      expect(newRequest._id.toString()).toBe(request._id.toString()); // Same request, status updated
    });

    it('should get pending friend requests', async () => {
      // User1 sends request to User2
      await user1.sendFriendRequest(user2._id.toString());

      // User2 gets pending requests
      const pendingRequests = await user2.getPendingFriendRequests();

      expect(pendingRequests).toHaveLength(1);
      expect(pendingRequests[0].sender.toString()).toBe(user1._id.toString());
      expect(pendingRequests[0].status).toBe(FriendRequestStatus.PENDING);
    });
  });

  // Test for handling blocked users
  it('should block a user successfully', async () => {
    const user1 = await User.create({
      name: 'Block Test User 1',
      email: 'block-test1@example.com',
      password: 'Password123',
      role: 'user',
      isEmailVerified: true,
    });

    const user2 = await User.create({
      name: 'Block Test User 2',
      email: 'block-test2@example.com',
      password: 'Password123',
      role: 'user',
      isEmailVerified: true,
    });

    // Block user2
    await User.findByIdAndUpdate(user1._id, {
      $push: { blockedUsers: user2._id },
    });

    const updatedUser1 = await User.findById(user1._id);
    expect(updatedUser1?.blockedUsers).toContainEqual(user2._id);
  });

  it('should not allow friend request if user is blocked', async () => {
    const user1 = await User.create({
      name: 'Block Test User 1',
      email: 'block-test1@example.com',
      password: 'Password123',
      role: 'user',
      isEmailVerified: true,
    });

    const user2 = await User.create({
      name: 'Block Test User 2',
      email: 'block-test2@example.com',
      password: 'Password123',
      role: 'user',
      isEmailVerified: true,
    });

    // User1 blocks user2
    await User.findByIdAndUpdate(user1._id, {
      $push: { blockedUsers: user2._id },
    });

    // User2 tries to send friend request to user1
    await expect(async () => {
      await user2.sendFriendRequest(user1._id.toString());
    }).rejects.toThrow('Unable to send friend request');
  });
});

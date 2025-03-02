
// import bcrypt from 'bcryptjs';
import {Document} from 'mongoose';

// Import your User model and interfaces
// Note: Adjust the import path based on your project structure
import User from '../../src/models/user.model';
import { IUser, IUserMethods } from '../../src/types/user';


describe('User Model Tests', () => {

  // Clear the database between tests
  afterEach(async () => {
    await User.deleteMany({});
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
    expect(user.friendRequests).toEqual([]);
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
      await user1.sendFriendRequest(user2._id.toString());
      
      // Reload user2 to get updated data
      const updatedUser2 = await User.findById(user2._id);
      
      expect(updatedUser2?.friendRequests.length).toBe(1);
      expect(updatedUser2?.friendRequests[0].from.toString()).toBe(user1._id.toString());
      expect(updatedUser2?.friendRequests[0].status).toBe('pending');
    });
    
    it('should accept friend request successfully', async () => {
      // User1 sends request to User2
      await user1.sendFriendRequest(user2._id.toString());
      
      // Reload user2
      let updatedUser2 = await User.findById(user2._id);
      const requestId = updatedUser2?.friendRequests[0]._id.toString();
      
      // User2 accepts the request
      await updatedUser2?.acceptFriendRequest(requestId as string);
      
      // Reload both users
      updatedUser2 = await User.findById(user2._id);
      const updatedUser1 = await User.findById(user1._id);
      
      // Check that they are now friends
      expect(updatedUser1?.friends).toContainEqual(user2._id);
      expect(updatedUser2?.friends).toContainEqual(user1._id);
      
      // Check that request status is updated
      const request = updatedUser2?.friendRequests.find(
        req => req._id.toString() === requestId
      );
      expect(request?.status).toBe('accepted');
    });
    
    it('should reject friend request successfully', async () => {
      // User1 sends request to User2
      await user1.sendFriendRequest(user2._id.toString());
      
      // Reload user2
      let updatedUser2 = await User.findById(user2._id);
      const requestId = updatedUser2?.friendRequests[0]._id.toString();
      
      // User2 rejects the request
      await updatedUser2?.rejectFriendRequest(requestId as string);
      
      // Reload user2
      updatedUser2 = await User.findById(user2._id);
      
      // Check that request status is updated
      const request = updatedUser2?.friendRequests.find(
        req => req._id.toString() === requestId
      );
      expect(request?.status).toBe('rejected');
      
      // Check that they are not friends
      expect(updatedUser2?.friends).not.toContainEqual(user1._id);
    });
    
    it('should remove friend successfully', async () => {
      // Setup: Make them friends first
      await user1.sendFriendRequest(user2._id.toString());
      let updatedUser2 = await User.findById(user2._id);
      const requestId = updatedUser2?.friendRequests[0]._id.toString();
      await updatedUser2?.acceptFriendRequest(requestId as string);
      
      // Now test removing friend
      updatedUser2 = await User.findById(user2._id);
      await updatedUser2?.removeFriend(user1._id.toString());
      
      // Reload both users
      updatedUser2 = await User.findById(user2._id);
      const updatedUser1 = await User.findById(user1._id);
      
      // Check that they are no longer friends
      expect(updatedUser2?.friends).not.toContainEqual(user1._id);
      expect(updatedUser1?.friends).not.toContainEqual(user2._id);
    });
    
    it('should not allow duplicate friend requests', async () => {
      // Send initial request
      await user1.sendFriendRequest(user2._id.toString());
      
      // Try to send duplicate request
      await expect(async () => {
        await user1.sendFriendRequest(user2._id.toString());
      }).rejects.toThrow();
    });
    
    it('should not allow self friend requests', async () => {
      await expect(async () => {
        await user1.sendFriendRequest(user1._id.toString());
      }).rejects.toThrow();
    });
  });

  // Test for handling blocked users
  it('should block a user successfully', async () => {
    // This test assumes you have a blockUser method
    // If you don't, you may need to implement it or adjust the test
    
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
    
    // Assuming you have a blockUser method
    // user1.blockUser(user2._id.toString());
    
    // If you don't have a blockUser method, you could test directly updating the model:
    await User.findByIdAndUpdate(user1._id, {
      $push: { blockedUsers: user2._id }
    });
    
    const updatedUser1 = await User.findById(user1._id);
    expect(updatedUser1?.blockedUsers).toContainEqual(user2._id);
  });
});
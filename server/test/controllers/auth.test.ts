// src/tests/controllers/auth.controller.test.ts
import { Request, Response, CookieOptions } from 'express';
import { AuthController } from '../../src/controllers/auth.controller';
import { AuthService } from '../../src/services/auth.service';
import User from '../../src/models/user.model';
import { AuthenticationError, ValidationError } from '../../src/utils/errors';
// src/tests/helpers/express-mocks.ts
import {jest, describe, it, expect, beforeEach, afterEach} from '@jest/globals';

// src/tests/helpers/express-mocks.ts
// import { Request, Response, CookieOptions } from 'express';

// Mock dependencies
jest.mock('../../src/services/auth.service');
jest.mock('../../src/models/user.model');

describe('AuthController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request, response, and next function
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      // Arrange
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      const serviceResponse = {
        user: { 
          _id: 'user_id',
          name: 'Test User',
          email: 'test@example.com'
        },
        token: 'jwt_token'
      };
      
      req.body = userData;
      
      // Mock service call
      jest.spyOn(AuthService, 'register').mockResolvedValue(serviceResponse);
      
      // Act
      await AuthController.register(req as Request, res as Response, next);
      
      // Assert
      expect(AuthService.register).toHaveBeenCalledWith(userData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(serviceResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass errors to next middleware', async () => {
      // Arrange
      const error = new ValidationError('Email already registered');
      jest.spyOn(AuthService, 'register').mockRejectedValue(error);
      
      // Act
      await AuthController.register(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      
      const serviceResponse = {
        user: { 
          _id: 'user_id',
          name: 'Test User',
          email: 'test@example.com'
        },
        token: 'jwt_token'
      };
      
      req.body = loginData;
      
      // Mock service call
      jest.spyOn(AuthService, 'login').mockResolvedValue(serviceResponse);
      
      // Act
      await AuthController.login(req as Request, res as Response, next);
      
      // Assert
      expect(AuthService.login).toHaveBeenCalledWith(loginData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass authentication errors to next middleware', async () => {
      // Arrange
      const error = new AuthenticationError('Invalid credentials');
      jest.spyOn(AuthService, 'login').mockRejectedValue(error);
      
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };
      
      // Act
      await AuthController.login(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('googleAuth', () => {
    it('should successfully authenticate with Google', async () => {
      // Arrange
      const googleData = {
        token: 'google_id_token'
      };
      
      const serviceResponse = {
        user: { 
          _id: 'user_id',
          name: 'Google User',
          email: 'google@example.com',
          googleId: 'google_id'
        },
        token: 'jwt_token'
      };
      
      req.body = googleData;
      
      // Mock service call
      jest.spyOn(AuthService, 'googleAuth').mockResolvedValue(serviceResponse);
      
      // Act
      await AuthController.googleAuth(req as Request, res as Response, next);
      
      // Assert
      expect(AuthService.googleAuth).toHaveBeenCalledWith(googleData.token);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when ID token is missing', async () => {
      // Arrange
      req.body = {}; // Empty body, no token
      
      // Act
      await AuthController.googleAuth(req as Request, res as Response, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Missing ID Token" });
      expect(AuthService.googleAuth).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass Google auth errors to next middleware', async () => {
      // Arrange
      const error = new AuthenticationError('Google authentication failed');
      jest.spyOn(AuthService, 'googleAuth').mockRejectedValue(error);
      
      req.body = {
        token: 'invalid_google_token'
      };
      
      // Act
      await AuthController.googleAuth(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email', async () => {
      // Arrange
      const verificationToken = 'valid_verification_token';
      const serviceResponse = { message: 'Email verified successfully' };
      
      req.params = { token: verificationToken };
      
      // Mock service call
      jest.spyOn(AuthService, 'verifyEmail').mockResolvedValue(serviceResponse);
      
      // Act
      await AuthController.verifyEmail(req as Request, res as Response, next);
      
      // Assert
      expect(AuthService.verifyEmail).toHaveBeenCalledWith(verificationToken);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass verification errors to next middleware', async () => {
      // Arrange
      const error = new ValidationError('Invalid or expired verification token');
      jest.spyOn(AuthService, 'verifyEmail').mockRejectedValue(error);
      
      req.params = { token: 'invalid_token' };
      
      // Act
      await AuthController.verifyEmail(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('requestPasswordReset', () => {
    it('should successfully request password reset', async () => {
      // Arrange
      const email = 'test@example.com';
      const serviceResponse = { message: 'Password reset email sent' };
      
      req.body = { email };
      
      // Mock service call
      jest.spyOn(AuthService, 'requestPasswordReset').mockResolvedValue(serviceResponse);
      
      // Act
      await AuthController.requestPasswordReset(req as Request, res as Response, next);
      
      // Assert
      expect(AuthService.requestPasswordReset).toHaveBeenCalledWith(email);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass password reset request errors to next middleware', async () => {
      // Arrange
      const error = new Error('Error sending password reset email');
      jest.spyOn(AuthService, 'requestPasswordReset').mockRejectedValue(error);
      
      req.body = { email: 'nonexistent@example.com' };
      
      // Act
      await AuthController.requestPasswordReset(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      // Arrange
      const token = 'valid_reset_token';
      const password = 'NewPassword123!';
      const serviceResponse = { message: 'Password reset successful' };
      
      req.params = { token };
      req.body = { password };
      
      // Mock service call
      jest.spyOn(AuthService, 'resetPassword').mockResolvedValue(serviceResponse);
      
      // Act
      await AuthController.resetPassword(req as Request, res as Response, next);
      
      // Assert
      expect(AuthService.resetPassword).toHaveBeenCalledWith(token, password);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass password reset errors to next middleware', async () => {
      // Arrange
      const error = new ValidationError('Invalid or expired reset token');
      jest.spyOn(AuthService, 'resetPassword').mockRejectedValue(error);
      
      req.params = { token: 'invalid_token' };
      req.body = { password: 'NewPassword123!' };
      
      // Act
      await AuthController.resetPassword(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user', async () => {
      // Arrange
      const userId = 'user_id';
      req.userId = userId;
      
      const mockUser = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
        getPublicProfile: jest.fn().mockReturnValue({
          _id: userId,
          name: 'Test User',
          email: 'test@example.com'
        })
      };
      
      // Mock User.findById
      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      
      // Act
      await AuthController.getCurrentUser(req as Request, res as Response, next);
      
      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockUser.getPublicProfile).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ 
        user: { 
          _id: userId,
          name: 'Test User',
          email: 'test@example.com'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass user retrieval errors to next middleware', async () => {
      // Arrange
      const error = new Error('Database error');
      req.userId = 'user_id';
      
      // Mock User.findById to throw
      (User.findById as jest.Mock).mockRejectedValue(error);
      
      // Act
      await AuthController.getCurrentUser(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('should successfully validate token', async () => {
      // Arrange
      const token = 'valid_jwt_token';
      const serviceResponse = { 
        valid: true,
        user: {
          _id: 'user_id',
          name: 'Test User',
          email: 'test@example.com'
        }
      };
      
      req.body = { token };
      
      // Mock service call
      jest.spyOn(AuthService, 'validateToken').mockResolvedValue(serviceResponse);
      
      // Act
      await AuthController.validateToken(req as Request, res as Response, next);
      
      // Assert
      expect(AuthService.validateToken).toHaveBeenCalledWith(token);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceResponse);
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass token validation errors to next middleware', async () => {
      // Arrange
      const error = new Error('Token validation error');
      jest.spyOn(AuthService, 'validateToken').mockRejectedValue(error);
      
      req.body = { token: 'invalid_token' };
      
      // Act
      await AuthController.validateToken(req as Request, res as Response, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});
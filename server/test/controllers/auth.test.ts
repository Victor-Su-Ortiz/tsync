import { Request, Response, NextFunction } from "express";
import { AuthController } from "../../src/controllers/auth.controller";
import * as AuthServiceModule from "../../src/services/auth.service";
import { AuthRequest } from "../../src/middleware/auth.middleware";
import mongoose from "mongoose";
// import { AuthenticationError, ValidationError, NotFoundError } from "../../src/utils/errors"

// This approach ensures we're mocking the same module that the controller imports
jest.mock("../../src/services/auth.service");

describe("AuthController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockAuthRequest: Partial<AuthRequest>;
  let mockNext: NextFunction;
  let mockUserId: string;
  
  // Get a reference to the mocked AuthService
  const AuthService = AuthServiceModule.AuthService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create a valid MongoDB ObjectId for testing
    mockUserId = new mongoose.Types.ObjectId().toString();
    
    // Setup mock request, response and next function
    mockRequest = {
      body: {},
      params: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    mockAuthRequest = {
      ...mockRequest,
      user: {
        _id: mockUserId,
        email: "test@example.com",
        name: "Test User",
        role: "user",
        isEmailVerified: true,
        getPublicProfile: jest.fn().mockReturnValue({
          _id: mockUserId,
          name: "Test User",
          email: "test@example.com",
          role: "user",
          isEmailVerified: true
        })
      }
    };
    
    mockNext = jest.fn();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      // Arrange
      const registerData = {
        name: "New User",
        email: "newuser@example.com",
        password: "Password123!"
      };
      mockRequest.body = registerData;
      
      const mockResult = {
        user: {
          _id: mockUserId,
          name: "New User",
          email: "newuser@example.com",
          role: "user",
          isEmailVerified: false
        },
        token: "jwt-token-for-new-user"
      };
      
      // Setup the mock to return our result
      jest.spyOn(AuthService, 'register').mockResolvedValueOnce(mockResult);

      // Act
      await AuthController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(AuthService.register).toHaveBeenCalledWith(registerData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

//     it("should handle email already registered error", async () => {
//       // Arrange
//       const registerData = {
//         name: "Existing User",
//         email: "existing@example.com",
//         password: "Password123!"
//       };
//       mockRequest.body = registerData;
      
//       const error = new ValidationError("Email already registered");
//       jest.spyOn(AuthService, 'register').mockRejectedValueOnce(error);

//       // Act
//       await AuthController.register(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.register).toHaveBeenCalledWith(registerData);
//       expect(mockNext).toHaveBeenCalledWith(error);
//     });
//   });

//   describe("login", () => {
//     it("should login a user successfully", async () => {
//       // Arrange
//       const loginData = {
//         email: "user@example.com",
//         password: "Password123!"
//       };
//       mockRequest.body = loginData;
      
//       const mockResult = {
//         user: {
//           _id: mockUserId,
//           name: "Test User",
//           email: "user@example.com",
//           role: "user",
//           isEmailVerified: true
//         },
//         token: "jwt-token-for-login"
//       };
      
//       jest.spyOn(AuthService, 'login').mockResolvedValueOnce(mockResult);

//       // Act
//       await AuthController.login(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.login).toHaveBeenCalledWith(loginData);
//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
//     });

//     it("should handle invalid credentials error", async () => {
//       // Arrange
//       const loginData = {
//         email: "user@example.com",
//         password: "WrongPassword"
//       };
//       mockRequest.body = loginData;
      
//       const error = new AuthenticationError("Invalid credentials");
//       jest.spyOn(AuthService, 'login').mockRejectedValueOnce(error);

//       // Act
//       await AuthController.login(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.login).toHaveBeenCalledWith(loginData);
//       expect(mockNext).toHaveBeenCalledWith(error);
//     });
//   });

//   describe("googleAuth", () => {
//     it("should authenticate with Google successfully", async () => {
//       // Arrange
//       const googleToken = "valid-google-id-token";
//       mockRequest.body = { token: googleToken };
      
//       const mockResult = {
//         user: {
//           _id: mockUserId,
//           name: "Google User",
//           email: "google@example.com",
//           role: "user",
//           isEmailVerified: true,
//           googleId: "google-sub-12345"
//         },
//         token: "jwt-token-for-google-auth"
//       };
      
//       jest.spyOn(AuthService, 'googleAuth').mockResolvedValueOnce(mockResult);

//       // Act
//       await AuthController.googleAuth(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.googleAuth).toHaveBeenCalledWith(googleToken);
//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
//     });

//     it("should return 400 if Google token is missing", async () => {
//       // Arrange
//       mockRequest.body = {}; // No token provided

//       // Act
//       await AuthController.googleAuth(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.googleAuth).not.toHaveBeenCalled();
//       expect(mockResponse.status).toHaveBeenCalledWith(400);
//       expect(mockResponse.json).toHaveBeenCalledWith({ message: "Missing ID Token" });
//     });

//     it("should handle Google authentication error", async () => {
//       // Arrange
//       const googleToken = "invalid-google-token";
//       mockRequest.body = { token: googleToken };
      
//       const error = new AuthenticationError("Google authentication failed");
//       jest.spyOn(AuthService, 'googleAuth').mockRejectedValueOnce(error);

//       // Act
//       await AuthController.googleAuth(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.googleAuth).toHaveBeenCalledWith(googleToken);
//       expect(mockNext).toHaveBeenCalledWith(error);
//     });
//   });

//   describe("verifyEmail", () => {
//     it("should verify email successfully", async () => {
//       // Arrange
//       const verificationToken = "valid-verification-token";
//       mockRequest.params = { token: verificationToken };
      
//       const mockResult = { message: "Email verified successfully" };
//       jest.spyOn(AuthService, 'verifyEmail').mockResolvedValueOnce(mockResult);

//       // Act
//       await AuthController.verifyEmail(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.verifyEmail).toHaveBeenCalledWith(verificationToken);
//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
//     });

//     it("should handle invalid verification token error", async () => {
//       // Arrange
//       const invalidToken = "invalid-verification-token";
//       mockRequest.params = { token: invalidToken };
      
//       const error = new ValidationError("Invalid or expired verification token");
//       jest.spyOn(AuthService, 'verifyEmail').mockRejectedValueOnce(error);

//       // Act
//       await AuthController.verifyEmail(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.verifyEmail).toHaveBeenCalledWith(invalidToken);
//       expect(mockNext).toHaveBeenCalledWith(error);
//     });
//   });

//   describe("requestPasswordReset", () => {
//     it("should request password reset successfully", async () => {
//       // Arrange
//       const email = "user@example.com";
//       mockRequest.body = { email };
      
//       const mockResult = { message: "Password reset email sent" };
//       jest.spyOn(AuthService, 'requestPasswordReset').mockResolvedValueOnce(mockResult);

//       // Act
//       await AuthController.requestPasswordReset(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.requestPasswordReset).toHaveBeenCalledWith(email);
//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
//     });

//     it("should handle user not found error", async () => {
//       // Arrange
//       const email = "nonexistent@example.com";
//       mockRequest.body = { email };
      
//       const error = new NotFoundError("No user found with this email");
//       jest.spyOn(AuthService, 'requestPasswordReset').mockRejectedValueOnce(error);

//       // Act
//       await AuthController.requestPasswordReset(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.requestPasswordReset).toHaveBeenCalledWith(email);
//       expect(mockNext).toHaveBeenCalledWith(error);
//     });

//     it("should handle email sending error", async () => {
//       // Arrange
//       const email = "user@example.com";
//       mockRequest.body = { email };
      
//       const error = new Error("Error sending password reset email");
//       jest.spyOn(AuthService, 'requestPasswordReset').mockRejectedValueOnce(error);

//       // Act
//       await AuthController.requestPasswordReset(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.requestPasswordReset).toHaveBeenCalledWith(email);
//       expect(mockNext).toHaveBeenCalledWith(error);
//     });
//   });

//   describe("resetPassword", () => {
//     it("should reset password successfully", async () => {
//       // Arrange
//       const resetToken = "valid-reset-token";
//       const newPassword = "NewPassword123!";
      
//       mockRequest.params = { token: resetToken };
//       mockRequest.body = { password: newPassword };
      
//       const mockResult = { message: "Password reset successful" };
//       jest.spyOn(AuthService, 'resetPassword').mockResolvedValueOnce(mockResult);

//       // Act
//       await AuthController.resetPassword(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.resetPassword).toHaveBeenCalledWith(resetToken, newPassword);
//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
//     });

//     it("should handle invalid or expired reset token error", async () => {
//       // Arrange
//       const invalidToken = "invalid-reset-token";
//       const newPassword = "NewPassword123!";
      
//       mockRequest.params = { token: invalidToken };
//       mockRequest.body = { password: newPassword };
      
//       const error = new ValidationError("Invalid or expired reset token");
//       jest.spyOn(AuthService, 'resetPassword').mockRejectedValueOnce(error);

//       // Act
//       await AuthController.resetPassword(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.resetPassword).toHaveBeenCalledWith(invalidToken, newPassword);
//       expect(mockNext).toHaveBeenCalledWith(error);
//     });
//   });

//   describe("getCurrentUser", () => {
//     it("should return current user's public profile", async () => {
//       // Arrange
//       const userPublicProfile = {
//         _id: mockUserId,
//         name: "Test User",
//         email: "test@example.com",
//         role: "user", 
//         isEmailVerified: true
//       };
      
//       mockAuthRequest.user!.getPublicProfile = jest.fn().mockReturnValue(userPublicProfile);

//       // Act
//       await AuthController.getCurrentUser(
//         mockAuthRequest as AuthRequest,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(mockAuthRequest.user!.getPublicProfile).toHaveBeenCalled();
//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith({ user: userPublicProfile });
//     });

//     it("should handle error when getting user profile", async () => {
//       // Arrange
//       const error = new Error("Error retrieving user profile");
//       mockAuthRequest.user!.getPublicProfile = jest.fn().mockImplementation(() => {
//         throw error;
//       });

//       // Act
//       await AuthController.getCurrentUser(
//         mockAuthRequest as AuthRequest,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(mockAuthRequest.user!.getPublicProfile).toHaveBeenCalled();
//       expect(mockNext).toHaveBeenCalledWith(error);
//     });
//   });

//   describe("validateToken", () => {
//     it("should validate a valid token successfully", async () => {
//       // Arrange
//       const token = "valid-jwt-token";
//       mockRequest.body = { token };
      
//       const mockResult = {
//         valid: true,
//         user: {
//           _id: mockUserId,
//           name: "Test User",
//           email: "test@example.com",
//           role: "user",
//           isEmailVerified: true
//         }
//       };
//       jest.spyOn(AuthService, 'validateToken').mockResolvedValueOnce(mockResult);

//       // Act
//       await AuthController.validateToken(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.validateToken).toHaveBeenCalledWith(token);
//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
//     });

//     it("should handle invalid token validation", async () => {
//       // Arrange
//       const invalidToken = "invalid-jwt-token";
//       mockRequest.body = { token: invalidToken };
      
//       const mockResult = { valid: false };
//       jest.spyOn(AuthService, 'validateToken').mockResolvedValueOnce(mockResult);

//       // Act
//       await AuthController.validateToken(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.validateToken).toHaveBeenCalledWith(invalidToken);
//       expect(mockResponse.status).toHaveBeenCalledWith(200);
//       expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
//     });

//     it("should handle unexpected error during token validation", async () => {
//       // Arrange
//       const token = "problematic-token";
//       mockRequest.body = { token };
      
//       const error = new Error("Unexpected error during token validation");
//       jest.spyOn(AuthService, 'validateToken').mockRejectedValueOnce(error);

//       // Act
//       await AuthController.validateToken(
//         mockRequest as Request,
//         mockResponse as Response,
//         mockNext
//       );

//       // Assert
//       expect(AuthService.validateToken).toHaveBeenCalledWith(token);
//       expect(mockNext).toHaveBeenCalledWith(error);
//     });
  });
});
import { AuthService } from "../../src/services/auth.service";
import User from "../../src/models/user.model";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "../../src/utils/email";
import {
  AuthenticationError,
  ValidationError,
//   NotFoundError,
} from "../../src/utils/errors";

// Mock dependencies
jest.mock("../../src/models/user.model");
jest.mock("jsonwebtoken");
jest.mock("crypto");
jest.mock("google-auth-library");
jest.mock("../../src/utils/email");

describe("AuthService", () => {
  // Setup common mocks and cleanup
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variables
    process.env.JWT_SECRET = "test-secret";
    process.env.CLIENT_URL = "http://localhost:3000";
    process.env.APP_NAME = "TestApp";
    process.env.GOOGLE_CLIENT_ID = "google-client-id";
  });

  describe("register", () => {
    const registerData = {
      name: "Test User",
      email: "test@example.com",
      password: "Password123!",
    };

    it("should register a new user successfully", async () => {
      // Mock User.findOne to return null (user doesn't exist)
      (User.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Mock crypto functions
      (crypto.randomBytes as jest.Mock).mockReturnValueOnce({
        toString: jest.fn().mockReturnValueOnce("verification-token"),
      });
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValueOnce("hashed-verification-token"),
      };
      (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);

      // Mock User.create
      const mockUser = {
        _id: "user-id-123",
        email: registerData.email,
        role: "user",
        getPublicProfile: jest.fn().mockReturnValue({
          _id: "user-id-123",
          name: registerData.name,
          email: registerData.email,
          role: "user",
        }),
      };
      (User.create as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock sendEmail
      (sendEmail as jest.Mock).mockResolvedValueOnce(undefined);

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValueOnce("test-token");

      // Call the method
      const result = await AuthService.register(registerData);
      console.log(result);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: registerData.email });
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(crypto.createHash).toHaveBeenCalledWith("sha256");
      expect(mockHash.update).toHaveBeenCalledWith("verification-token");
      expect(mockHash.digest).toHaveBeenCalledWith("hex");
      
      expect(User.create).toHaveBeenCalledWith({
        ...registerData,
        verificationToken: "hashed-verification-token",
        isEmailVerified: false,
      });
      
      expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: registerData.email,
        subject: "Please verify your email",
      }));
      
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser._id,
          email: mockUser.email,
          role: mockUser.role,
        },
        "test-secret",
        { expiresIn: "1d" }
      );
      
      expect(result).toEqual({
        user: mockUser.getPublicProfile(),
        token: "test-token",
      });
    });

    it("should throw ValidationError if email already exists", async () => {
      // Mock User.findOne to return an existing user
      (User.findOne as jest.Mock).mockResolvedValueOnce({
        email: registerData.email,
      });

      // Call and assert
      await expect(AuthService.register(registerData)).rejects.toThrow(
        ValidationError
      );
      expect(User.create).not.toHaveBeenCalled();
    });

    it("should create user even if sending email fails", async () => {
      // Mock User.findOne to return null
      (User.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Mock crypto functions
      (crypto.randomBytes as jest.Mock).mockReturnValueOnce({
        toString: jest.fn().mockReturnValueOnce("verification-token"),
      });
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValueOnce("hashed-verification-token"),
      };
      (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);

      // Mock User.create
      const mockUser = {
        _id: "user-id-123",
        email: registerData.email,
        role: "user",
        getPublicProfile: jest.fn().mockReturnValue({
          _id: "user-id-123",
          name: registerData.name,
          email: registerData.email,
          role: "user",
        }),
      };
      (User.create as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock sendEmail to throw error
      (sendEmail as jest.Mock).mockRejectedValueOnce(new Error("Email error"));

      // Mock console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValueOnce("test-token");

      // Call the method
      const result = await AuthService.register(registerData);

      // Assertions
      expect(User.create).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
      expect(result).toEqual({
        user: mockUser.getPublicProfile(),
        token: "test-token",
      });

      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe("login", () => {
    const loginData = {
      email: "test@example.com",
      password: "Password123!",
    };

    it("should login a user successfully", async () => {
      // Mock User.findOne
      const mockUser = {
        _id: "user-id-123",
        email: loginData.email,
        role: "user",
        lastLogin: null,
        save: jest.fn().mockResolvedValueOnce(undefined),
        comparePassword: jest.fn().mockResolvedValueOnce(true),
        getPublicProfile: jest.fn().mockReturnValue({
          _id: "user-id-123",
          email: loginData.email,
          role: "user",
        }),
      };
      (User.findOne as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockResolvedValueOnce(mockUser),
      }));

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValueOnce("test-token");

      // Call the method
      const result = await AuthService.login(loginData);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser._id,
          email: mockUser.email,
          role: mockUser.role,
        },
        "test-secret",
        { expiresIn: "1d" }
      );
      expect(result).toEqual({
        user: mockUser.getPublicProfile(),
        token: "test-token",
      });
    });

    it("should throw AuthenticationError if user not found", async () => {
      // Mock User.findOne to return null
      (User.findOne as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockResolvedValueOnce(null),
      }));

      // Call and assert
      await expect(AuthService.login(loginData)).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should throw AuthenticationError if password is invalid", async () => {
      // Mock User.findOne
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValueOnce(false),
      };
      (User.findOne as jest.Mock).mockImplementationOnce(() => ({
        select: jest.fn().mockResolvedValueOnce(mockUser),
      }));

      // Call and assert
      await expect(AuthService.login(loginData)).rejects.toThrow(
        AuthenticationError
      );
    });
  });

  describe("googleAuth", () => {
    const idToken = "google-id-token";
    const googlePayload = {
      email: "google@example.com",
      name: "Google User",
      sub: "google-sub-123",
      picture: "https://example.com/profile.jpg",
    };

    it("should authenticate with Google and create a new user", async () => {
      // Mock OAuth2Client
      const mockTicket = {
        getPayload: jest.fn().mockReturnValueOnce(googlePayload),
      };
      const mockVerifyIdToken = jest.fn().mockResolvedValueOnce(mockTicket);
      (OAuth2Client as jest.Mock).mockImplementation(() => ({
        verifyIdToken: mockVerifyIdToken,
      }));

      // Mock User.findOne to return null (no existing user)
      (User.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Mock crypto for random password
      (crypto.randomBytes as jest.Mock).mockReturnValueOnce({
        toString: jest.fn().mockReturnValueOnce("random-password"),
      });

      // Mock User.create
      const mockUser = {
        _id: "user-id-123",
        email: googlePayload.email,
        role: "user",
        getPublicProfile: jest.fn().mockReturnValueOnce({
          _id: "user-id-123",
          email: googlePayload.email,
          name: googlePayload.name,
          role: "user",
        }),
      };
      (User.create as jest.Mock).mockResolvedValueOnce(mockUser);

      // Mock JWT sign
      (jwt.sign as jest.Mock).mockReturnValueOnce("test-token");

      // Call the method
      const result = await AuthService.googleAuth(idToken);

      // Assertions
      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      expect(User.findOne).toHaveBeenCalledWith({ email: googlePayload.email });
      expect(User.create).toHaveBeenCalledWith({
        email: googlePayload.email,
        name: googlePayload.name,
        googleId: googlePayload.sub,
        profilePicture: googlePayload.picture,
        isEmailVerified: true,
        password: "random-password",
      });
      expect(jwt.sign).toHaveBeenCalled();
      expect(result).toEqual({
        user: mockUser.getPublicProfile(),
        token: "test-token",
      });
    });

//     it("should authenticate with Google and update existing user", async () => {
//       // Mock OAuth2Client
//       const mockTicket = {
//         getPayload: jest.fn().mockReturnValueOnce(googlePayload),
//       };
//       const mockVerifyIdToken = jest.fn().mockResolvedValueOnce(mockTicket);
//       (OAuth2Client as jest.Mock).mockImplementation(() => ({
//         verifyIdToken: mockVerifyIdToken,
//       }));

//       // Mock User.findOne to return existing user
//       const mockUser = {
//         _id: "user-id-123",
//         email: googlePayload.email,
//         role: "user",
//         googleId: null,
//         profilePicture: null,
//         isEmailVerified: false,
//         save: jest.fn().mockResolvedValueOnce(undefined),
//         getPublicProfile: jest.fn().mockReturnValueOnce({
//           _id: "user-id-123",
//           email: googlePayload.email,
//           name: "Existing User",
//           role: "user",
//         }),
//       };
//       (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

//       // Mock JWT sign
//       (jwt.sign as jest.Mock).mockReturnValueOnce("test-token");

//       // Call the method
//       const result = await AuthService.googleAuth(idToken);

//       // Assertions
//       expect(User.create).not.toHaveBeenCalled();
//       expect(mockUser.googleId).toBe(googlePayload.sub);
//       expect(mockUser.isEmailVerified).toBe(true);
//       expect(mockUser.profilePicture).toBe(googlePayload.picture);
//       expect(mockUser.save).toHaveBeenCalled();
//       expect(result).toEqual({
//         user: mockUser.getPublicProfile(),
//         token: "test-token",
//       });
//     });

//     it("should throw AuthenticationError if Google token verification fails", async () => {
//       // Mock OAuth2Client to throw error
//       const mockVerifyIdToken = jest.fn().mockRejectedValueOnce(
//         new Error("Invalid token")
//       );
//       (OAuth2Client as jest.Mock).mockImplementation(() => ({
//         verifyIdToken: mockVerifyIdToken,
//       }));

//       // Mock console.log
//       const originalConsoleLog = console.log;
//       console.log = jest.fn();

//       // Call and assert
//       await expect(AuthService.googleAuth(idToken)).rejects.toThrow(
//         AuthenticationError
//       );
      
//       // Restore console.log
//       console.log = originalConsoleLog;
//     });

//     it("should throw AuthenticationError if Google payload is missing email", async () => {
//       // Mock OAuth2Client with missing email
//       const mockTicket = {
//         getPayload: jest.fn().mockReturnValueOnce({ sub: "123" }), // No email
//       };
//       const mockVerifyIdToken = jest.fn().mockResolvedValueOnce(mockTicket);
//       (OAuth2Client as jest.Mock).mockImplementation(() => ({
//         verifyIdToken: mockVerifyIdToken,
//       }));

//       // Call and assert
//       await expect(AuthService.googleAuth(idToken)).rejects.toThrow(
//         AuthenticationError
//       );
//     });
//   });

//   describe("verifyEmail", () => {
//     const token = "verification-token";

//     it("should verify email successfully", async () => {
//       // Mock crypto hash
//       const mockHash = {
//         update: jest.fn().mockReturnThis(),
//         digest: jest.fn().mockReturnValueOnce("hashed-token"),
//       };
//       (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);

//       // Mock User.findOne
//       const mockUser = {
//         isEmailVerified: false,
//         verificationToken: "hashed-token",
//         save: jest.fn().mockResolvedValueOnce(undefined),
//       };
//       (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

//       // Call the method
//       const result = await AuthService.verifyEmail(token);

//       // Assertions
//       expect(crypto.createHash).toHaveBeenCalledWith("sha256");
//       expect(mockHash.update).toHaveBeenCalledWith(token);
//       expect(User.findOne).toHaveBeenCalledWith({
//         verificationToken: "hashed-token",
//       });
//       expect(mockUser.isEmailVerified).toBe(true);
//       expect(mockUser.verificationToken).toBeUndefined();
//       expect(mockUser.save).toHaveBeenCalled();
//       expect(result).toEqual({ message: "Email verified successfully" });
//     });

//     it("should throw ValidationError if token is invalid", async () => {
//       // Mock crypto hash
//       const mockHash = {
//         update: jest.fn().mockReturnThis(),
//         digest: jest.fn().mockReturnValueOnce("hashed-token"),
//       };
//       (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);

//       // Mock User.findOne to return null
//       (User.findOne as jest.Mock).mockResolvedValueOnce(null);

//       // Call and assert
//       await expect(AuthService.verifyEmail(token)).rejects.toThrow(
//         ValidationError
//       );
//     });
//   });

//   describe("requestPasswordReset", () => {
//     const email = "test@example.com";

//     it("should send password reset email successfully", async () => {
//       // Mock User.findOne
//       const mockUser = {
//         email,
//         resetPasswordToken: null,
//         resetPasswordExpire: null,
//         save: jest.fn().mockResolvedValueOnce(undefined),
//       };
//       (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

//       // Mock crypto
//       (crypto.randomBytes as jest.Mock).mockReturnValueOnce({
//         toString: jest.fn().mockReturnValueOnce("reset-token"),
//       });
//       const mockHash = {
//         update: jest.fn().mockReturnThis(),
//         digest: jest.fn().mockReturnValueOnce("hashed-reset-token"),
//       };
//       (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);

//       // Mock Date.now
//       const originalDateNow = Date.now;
//       Date.now = jest.fn().mockReturnValueOnce(1000);

//       // Mock sendEmail
//       (sendEmail as jest.Mock).mockResolvedValueOnce(undefined);

//       // Call the method
//       const result = await AuthService.requestPasswordReset(email);

//       // Assertions
//       expect(User.findOne).toHaveBeenCalledWith({ email });
//       expect(crypto.randomBytes).toHaveBeenCalledWith(32);
//       expect(crypto.createHash).toHaveBeenCalledWith("sha256");
//       expect(mockHash.update).toHaveBeenCalledWith("reset-token");
//       expect(mockUser.resetPasswordToken).toBe("hashed-reset-token");
//       expect(mockUser.resetPasswordExpire).toEqual(new Date(1000 + 30 * 60 * 1000));
//       expect(mockUser.save).toHaveBeenCalled();
//       expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
//         to: email,
//         subject: "Password Reset Request",
//       }));
//       expect(result).toEqual({ message: "Password reset email sent" });

//       // Restore Date.now
//       Date.now = originalDateNow;
//     });

//     it("should throw NotFoundError if user not found", async () => {
//       // Mock User.findOne to return null
//       (User.findOne as jest.Mock).mockResolvedValueOnce(null);

//       // Call and assert
//       await expect(AuthService.requestPasswordReset(email)).rejects.toThrow(
//         NotFoundError
//       );
//     });

//     it("should clean up if email sending fails", async () => {
//       // Mock User.findOne
//       const mockUser = {
//         email,
//         resetPasswordToken: null,
//         resetPasswordExpire: null,
//         save: jest.fn().mockResolvedValueOnce(undefined),
//       };
//       (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

//       // Mock crypto
//       (crypto.randomBytes as jest.Mock).mockReturnValueOnce({
//         toString: jest.fn().mockReturnValueOnce("reset-token"),
//       });
//       const mockHash = {
//         update: jest.fn().mockReturnThis(),
//         digest: jest.fn().mockReturnValueOnce("hashed-reset-token"),
//       };
//       (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);

//       // Mock sendEmail to throw error
//       (sendEmail as jest.Mock).mockRejectedValueOnce(new Error("Email error"));

//       // Call and assert
//       await expect(AuthService.requestPasswordReset(email)).rejects.toThrow(
//         "Error sending password reset email"
//       );
      
//       // Verify cleanup
//       expect(mockUser.resetPasswordToken).toBeUndefined();
//       expect(mockUser.resetPasswordExpire).toBeUndefined();
//       expect(mockUser.save).toHaveBeenCalled();
//     });
//   });

//   describe("resetPassword", () => {
//     const token = "reset-token";
//     const newPassword = "NewPassword123!";

//     it("should reset password successfully", async () => {
//       // Mock crypto hash
//       const mockHash = {
//         update: jest.fn().mockReturnThis(),
//         digest: jest.fn().mockReturnValueOnce("hashed-token"),
//       };
//       (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);

//       // Mock Date.now
//       const originalDateNow = Date.now;
//       Date.now = jest.fn().mockReturnValueOnce(1000);

//       // Mock User.findOne
//       const mockUser = {
//         password: "old-password",
//         resetPasswordToken: "hashed-token",
//         resetPasswordExpire: new Date(2000), // Future date
//         save: jest.fn().mockResolvedValueOnce(undefined),
//       };
//       (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);

//       // Call the method
//       const result = await AuthService.resetPassword(token, newPassword);

//       // Assertions
//       expect(crypto.createHash).toHaveBeenCalledWith("sha256");
//       expect(mockHash.update).toHaveBeenCalledWith(token);
//       expect(User.findOne).toHaveBeenCalledWith({
//         resetPasswordToken: "hashed-token",
//         resetPasswordExpire: { $gt: 1000 },
//       });
//       expect(mockUser.password).toBe(newPassword);
//       expect(mockUser.resetPasswordToken).toBeUndefined();
//       expect(mockUser.resetPasswordExpire).toBeUndefined();
//       expect(mockUser.save).toHaveBeenCalled();
//       expect(result).toEqual({ message: "Password reset successful" });

//       // Restore Date.now
//       Date.now = originalDateNow;
//     });

//     it("should throw ValidationError if token is invalid or expired", async () => {
//       // Mock crypto hash
//       const mockHash = {
//         update: jest.fn().mockReturnThis(),
//         digest: jest.fn().mockReturnValueOnce("hashed-token"),
//       };
//       (crypto.createHash as jest.Mock).mockReturnValueOnce(mockHash);

//       // Mock User.findOne to return null
//       (User.findOne as jest.Mock).mockResolvedValueOnce(null);

//       // Call and assert
//       await expect(AuthService.resetPassword(token, newPassword)).rejects.toThrow(
//         ValidationError
//       );
//     });
//   });

//   describe("validateToken", () => {
//     const token = "valid-token";

//     it("should validate token successfully", async () => {
//       // Mock jwt.verify
//       const decoded = {
//         userId: "user-id-123",
//         email: "test@example.com",
//         role: "user",
//       };
//       (jwt.verify as jest.Mock).mockReturnValueOnce(decoded);

//       // Mock User.findById
//       const mockUser = {
//         _id: decoded.userId,
//         getPublicProfile: jest.fn().mockReturnValueOnce({
//           _id: decoded.userId,
//           email: decoded.email,
//           role: decoded.role,
//         }),
//       };
//       (User.findById as jest.Mock).mockResolvedValueOnce(mockUser);

//       // Call the method
//       const result = await AuthService.validateToken(token);

//       // Assertions
//       expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret");
//       expect(User.findById).toHaveBeenCalledWith(decoded.userId);
//       expect(result).toEqual({
//         valid: true,
//         user: mockUser.getPublicProfile(),
//       });
//     });

//     it("should return invalid if user not found", async () => {
//       // Mock jwt.verify
//       const decoded = {
//         userId: "user-id-123",
//       };
//       (jwt.verify as jest.Mock).mockReturnValueOnce(decoded);

//       // Mock User.findById to return null
//       (User.findById as jest.Mock).mockResolvedValueOnce(null);

//       // Call the method
//       const result = await AuthService.validateToken(token);

//       // Assertions
//       expect(result).toEqual({ valid: false });
//     });

//     it("should return invalid if token verification fails", async () => {
//       // Mock jwt.verify to throw error
//       (jwt.verify as jest.Mock).mockImplementationOnce(() => {
//         throw new Error("Invalid token");
//       });

//       // Call the method
//       const result = await AuthService.validateToken(token);

//       // Assertions
//       expect(result).toEqual({ valid: false });
//       expect(User.findById).not.toHaveBeenCalled();
//     });
//   });

//   describe("changePassword", () => {
//     const userId = "user-id-123";
//     const currentPassword = "CurrentPassword123!";
//     const newPassword = "NewPassword123!";

//     it("should change password successfully", async () => {
//       // Mock User.findById
//       const mockUser = {
//         comparePassword: jest.fn().mockResolvedValueOnce(true),
//         password: currentPassword,
//         save: jest.fn().mockResolvedValueOnce(undefined),
//       };
//       (User.findById as jest.Mock).mockImplementationOnce(() => ({
//         select: jest.fn().mockResolvedValueOnce(mockUser),
//       }));

//       // Call the method
//       const result = await AuthService.changePassword(
//         userId,
//         currentPassword,
//         newPassword
//       );

//       // Assertions
//       expect(User.findById).toHaveBeenCalledWith(userId);
//       expect(mockUser.comparePassword).toHaveBeenCalledWith(currentPassword);
//       expect(mockUser.password).toBe(newPassword);
//       expect(mockUser.save).toHaveBeenCalled();
//       expect(result).toEqual({ message: "Password changed successfully" });
//     });

//     it("should throw NotFoundError if user not found", async () => {
//       // Mock User.findById to return null
//       (User.findById as jest.Mock).mockImplementationOnce(() => ({
//         select: jest.fn().mockResolvedValueOnce(null),
//       }));

//       // Call and assert
//       await expect(
//         AuthService.changePassword(userId, currentPassword, newPassword)
//       ).rejects.toThrow(NotFoundError);
//     });

//     it("should throw AuthenticationError if current password is incorrect", async () => {
//       // Mock User.findById
//       const mockUser = {
//         comparePassword: jest.fn().mockResolvedValueOnce(false),
//       };
//       (User.findById as jest.Mock).mockImplementationOnce(() => ({
//         select: jest.fn().mockResolvedValueOnce(mockUser),
//       }));

//       // Call and assert
//       await expect(
//         AuthService.changePassword(userId, currentPassword, newPassword)
//       ).rejects.toThrow(AuthenticationError);
//       expect(mockUser.comparePassword).toHaveBeenCalledWith(currentPassword);
//     });
  });
});
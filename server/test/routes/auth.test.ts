import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { describe, it, jest, expect, beforeEach } from '@jest/globals';

// Define the controller function type to match your actual controller
type ControllerFn = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => Promise<void>;

// interface AuthResponse {
//   success: boolean;
//   message?: string;
//   data?: any;
//   errors?: string[];
// }

// Extend Express Request to include user
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//         email: string;
//       };
//     }
//   }
// }
// Create mock controller

import { AuthController } from '../../src/controllers/auth.controller';
import authRoutes from '../../src/routes/auth.routes';
// import { protect } from '../src/middleware/auth.middleware';

// Mock the validation schema
// Mock the auth controller and middleware
// jest.mock('mongoose');
jest.mock('../src/models/user');
jest.mock('../src/services/auth.service');



describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new express application for each test
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  describe('POST /auth/register', () => {
    const validRegisterData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('should successfully register a new user', async () => {
     // Mock the static register method
     (AuthController.register as jest.MockedFunction<ControllerFn>).mockImplementation(async (_req: Request, res: Response, _next: NextFunction) => {
        res.status(201).json({
          success: true, 
          message: 'User registered successfully',
          data: { 
            ...validRegisterData, 
            password: undefined 
          }
        });
    });
      const response = await request(app)
        .post('/auth/register')
        .send(validRegisterData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(AuthController.register).toHaveBeenCalled();
    });

    // it('should handle registration validation errors', async () => {
    //   const invalidData = {
    //     email: 'invalid-email',
    //     password: '123' // Too short
    //   };

    //   (validateRequest as jest.Mock).mockImplementation(() => (req, res, next) => {
    //     res.status(400).json({
    //       success: false,
    //       message: 'Validation failed',
    //       errors: ['Invalid email format', 'Password too short']
    //     });
    //   });

    //   const response = await request(app)
    //     .post('/auth/register')
    //     .send(invalidData);

    //   expect(response.status).toBe(400);
    //   expect(response.body.success).toBe(false);
    //   expect(AuthController.register).not.toHaveBeenCalled();
    // });
  });

  // describe('POST /auth/login', () => {
  //   const validLoginData = {
  //     email: 'test@example.com',
  //     password: 'Password123!'
  //   };

    // it('should successfully login a user', async () => {
    //   (AuthController.login as jest.Mock).mockImplementation((req, res) => {
    //     res.status(200).json({
    //       success: true,
    //       message: 'Login successful',
    //       data: {
    //         token: 'jwt-token',
    //         user: { email: validLoginData.email }
    //       }
    //     });
    //   });

    //   const response = await request(app)
    //     .post('/auth/login')
    //     .send(validLoginData);

    //   expect(response.status).toBe(200);
    //   expect(response.body.success).toBe(true);
    //   expect(response.body.data.token).toBeDefined();
    //   expect(AuthController.login).toHaveBeenCalled();
    // });

  //   it('should handle invalid credentials', async () => {
  //     (AuthController.login as jest.Mock).mockImplementation((req, res) => {
  //       res.status(401).json({
  //         success: false,
  //         message: 'Invalid credentials'
  //       });
  //     });

  //     const response = await request(app)
  //       .post('/auth/login')
  //       .send({ ...validLoginData, password: 'wrongpassword' });

  //     expect(response.status).toBe(401);
  //     expect(response.body.success).toBe(false);
  //   });
  // });

  // describe('POST /auth/google', () => {
  //   const validGoogleData = {
  //     idToken: 'valid-google-token'
  //   };

  //   it('should successfully authenticate with Google', async () => {
  //     (AuthController.googleAuth as jest.Mock).mockImplementation((req, res) => {
  //       res.status(200).json({
  //         success: true,
  //         message: 'Google authentication successful',
  //         data: {
  //           token: 'jwt-token',
  //           user: { email: 'google@example.com' }
  //         }
  //       });
  //     });

  //     const response = await request(app)
  //       .post('/auth/google')
  //       .send(validGoogleData);

  //     expect(response.status).toBe(200);
  //     expect(response.body.success).toBe(true);
  //     expect(AuthController.googleAuth).toHaveBeenCalled();
  //   });

  //   it('should handle invalid Google token', async () => {
  //     (AuthController.googleAuth as jest.Mock).mockImplementation((req, res) => {
  //       res.status(401).json({
  //         success: false,
  //         message: 'Invalid Google token'
  //       });
  //     });

  //     const response = await request(app)
  //       .post('/auth/google')
  //       .send({ idToken: 'invalid-token' });

  //     expect(response.status).toBe(401);
  //     expect(response.body.success).toBe(false);
  //   });
  // });

  // describe('GET /auth/verify-email/:token', () => {
  //   it('should successfully verify email', async () => {
  //     (AuthController.verifyEmail as jest.Mock).mockImplementation((req, res) => {
  //       res.status(200).json({
  //         success: true,
  //         message: 'Email verified successfully'
  //       });
  //     });

  //     const response = await request(app)
  //       .get('/auth/verify-email/valid-token');

  //     expect(response.status).toBe(200);
  //     expect(response.body.success).toBe(true);
  //     expect(AuthController.verifyEmail).toHaveBeenCalled();
  //   });

  //   it('should handle invalid verification token', async () => {
  //     (AuthController.verifyEmail as jest.Mock).mockImplementation((req, res) => {
  //       res.status(400).json({
  //         success: false,
  //         message: 'Invalid verification token'
  //       });
  //     });

  //     const response = await request(app)
  //       .get('/auth/verify-email/invalid-token');

  //     expect(response.status).toBe(400);
  //     expect(response.body.success).toBe(false);
  //   });
  // });

  // describe('POST /auth/forgot-password', () => {
  //   it('should successfully initiate password reset', async () => {
  //     (AuthController.requestPasswordReset as jest.Mock).mockImplementation((req, res) => {
  //       res.status(200).json({
  //         success: true,
  //         message: 'Password reset email sent'
  //       });
  //     });

  //     const response = await request(app)
  //       .post('/auth/forgot-password')
  //       .send({ email: 'test@example.com' });

  //     expect(response.status).toBe(200);
  //     expect(response.body.success).toBe(true);
  //     expect(AuthController.requestPasswordReset).toHaveBeenCalled();
  //   });
  // });

  // describe('POST /auth/reset-password/:token', () => {
  //   const resetData = {
  //     password: 'NewPassword123!',
  //     confirmPassword: 'NewPassword123!'
  //   };

  //   it('should successfully reset password', async () => {
  //     (AuthController.resetPassword as jest.Mock).mockImplementation((req, res) => {
  //       res.status(200).json({
  //         success: true,
  //         message: 'Password reset successful'
  //       });
  //     });

  //     const response = await request(app)
  //       .post('/auth/reset-password/valid-token')
  //       .send(resetData);

  //     expect(response.status).toBe(200);
  //     expect(response.body.success).toBe(true);
  //     expect(AuthController.resetPassword).toHaveBeenCalled();
  //   });

  //   it('should handle invalid reset token', async () => {
  //     (AuthController.resetPassword as jest.Mock).mockImplementation((req, res) => {
  //       res.status(400).json({
  //         success: false,
  //         message: 'Invalid or expired reset token'
  //       });
  //     });

  //     const response = await request(app)
  //       .post('/auth/reset-password/invalid-token')
  //       .send(resetData);

  //     expect(response.status).toBe(400);
  //     expect(response.body.success).toBe(false);
  //   });
  // });

  // describe('GET /auth/me', () => {
  //   it('should return current user data for authenticated user', async () => {
  //     // Mock the protect middleware to simulate authenticated user
  //     (protect as jest.Mock).mockImplementation((req: Request, res: Response, next: NextFunction) => {
  //       req.user = { id: '123', email: 'test@example.com' };
  //       next();
  //     });

  //     (AuthController.getCurrentUser as jest.Mock).mockImplementation((req, res) => {
  //       res.status(200).json({
  //         success: true,
  //         data: { user: req.user }
  //       });
  //     });

  //     const response = await request(app)
  //       .get('/auth/me')
  //       .set('Authorization', 'Bearer valid-token');

  //     expect(response.status).toBe(200);
  //     expect(response.body.success).toBe(true);
  //     expect(response.body.data.user).toBeDefined();
  //     expect(AuthController.getCurrentUser).toHaveBeenCalled();
  //   });

  //   it('should handle unauthenticated access', async () => {
  //     (protect as jest.Mock).mockImplementation((req, res, next) => {
  //       res.status(401).json({
  //         success: false,
  //         message: 'Not authenticated'
  //       });
  //     });

  //     const response = await request(app)
  //       .get('/auth/me')
  //       .set('Authorization', 'Bearer invalid-token');

  //     expect(response.status).toBe(401);
  //     expect(response.body.success).toBe(false);
  //     expect(AuthController.getCurrentUser).not.toHaveBeenCalled();
  //   });
});
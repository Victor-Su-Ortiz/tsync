import { Request, Response, NextFunction } from 'express';
import { IAuthService } from '../types/services/auth.service.types';
import User from '../models/user.model';
// import { AuthRequest } from "../middleware/auth.middleware";

export class AuthController {
  /**
   * AuthController handles authentication-related requests.
   * It provides methods for user registration, login, Google authentication,
   * email verification, password reset, and fetching the current user.
   */
  authService: IAuthService;
  constructor(authService: IAuthService) {
    this.authService = authService;
  }
  // Register new user
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Login user
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login({ email, password });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  //   Google authentication
  googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idToken, accessToken, serverAuthCode } = req.body;
      if (!idToken) {
        res.status(400).json({ message: 'Missing ID Token' });
        return;
      }

      const authResponse = await this.authService.googleAuth(idToken, accessToken, serverAuthCode);
      console.log('✅ Google Auth Success:', authResponse);

      res.status(200).json(authResponse);
    } catch (error) {
      console.error('❌ Google Auth Failed:', error);
      next(error); // ✅ Pass error to Express error handler
    }
  };

  // Verify email
  verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const result = await this.authService.verifyEmail(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Request password reset
  requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const result = await this.authService.requestPasswordReset(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Reset password
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      const result = await this.authService.resetPassword(token, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  // Get current user
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.userId);
      res.status(200).json({ user: user!.getPublicProfile() });
    } catch (error) {
      next(error);
    }
  }

  // Validate token
  validateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      const result = await this.authService.validateToken(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

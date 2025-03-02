import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import User from "../models/user.model";
// import { AuthRequest } from "../middleware/auth.middleware";

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Login user
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login({ email, password });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  //   Google authentication
  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      const { token } = req.body;
      if (!token) {
        res.status(400).json({ message: "Missing ID Token" });
        return;
      }

      const authResponse = await AuthService.googleAuth(token);
      console.log("✅ Google Auth Success:", authResponse);

      res.status(200).json(authResponse);
    } catch (error) {
      console.error("❌ Google Auth Failed:", error);
      next(error); // ✅ Pass error to Express error handler
    }
  }

  // Verify email
  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const result = await AuthService.verifyEmail(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Request password reset
  static async requestPasswordReset(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = req.body;
      const result = await AuthService.requestPasswordReset(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Reset password
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      const result = await AuthService.resetPassword(token, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get current user
  static async getCurrentUser(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const user = await User.findById(req.userId);
      res.status(200).json({ user: user!.getPublicProfile() });
    } catch (error) {
      next(error);
    }
  }

  // Validate token
  static async validateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const result = await AuthService.validateToken(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

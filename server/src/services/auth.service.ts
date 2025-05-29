import User from '../models/user.model';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/email';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/errors';
import {
  IAuthService,
  RegisterUserInput,
  LoginInput,
  TokenPayload,
  AuthResponse,
} from '../types/services-types/auth.service.types';

import { GoogleService } from './google.services';

export class AuthService implements IAuthService {
  /**
   * Generate JWT Token
   */
  private static generateToken(user: any): string {
    const payload: TokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
    const secret: Secret = process.env.JWT_SECRET as string;
    const options: SignOptions = {
      expiresIn: '1d',
    };

    return jwt.sign(payload, secret, options);
  }

  /**
   * Register new user
   */
  public async register(userData: RegisterUserInput): Promise<AuthResponse> {
    // Existing implementation...
    const { email } = userData;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Create user
    const user = await User.create({
      ...userData,
      verificationToken: hashedVerificationToken,
      isEmailVerified: false,
    });

    // Send verification email
    try {
      // Verification email code commented out in original
    } catch (error) {
      // If email fails, still create user but log error
      console.error('Verification email failed:', error);
    }

    // Generate token
    const token = AuthService.generateToken(user);

    return {
      user: user.getPublicProfile(),
      token,
    };
  }

  /**
   * Login user
   */
  public async login(loginData: LoginInput): Promise<AuthResponse> {
    // Existing implementation...
    const { email, password } = loginData;

    // Find user and select password (normally excluded)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = AuthService.generateToken(user);

    return {
      user: user.getPublicProfile(),
      token,
    };
  }

  /**
   * Google OAuth Authentication
   */
  public async googleAuth(
    idToken: string,
    accessToken: string,
    code: string
  ): Promise<AuthResponse> {
    try {
      // Store tokens.refresh_token securely
      const oauth2Client = GoogleService.createOauth2Client();
      const ticket = await oauth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new AuthenticationError('Invalid Google token');
      }

      const googleTokens = (await oauth2Client.getToken(code)).tokens;

      // const googleTokens = await GoogleAuthService.generateTokens(code);
      if (!googleTokens.refresh_token) {
        throw new AuthenticationError('Failed to get refresh token');
      }
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: googleTokens.refresh_token,
      });

      // Step 4: Fetch profile picture if not present in ID token
      if (!payload.picture) {
        await GoogleService.setProfilePicture(payload, oauth2Client);
      }

      // Step 5: Find or create user
      let user = await User.findOne({ email: payload.email });

      if (!user) {
        // Create new user from Google data
        user = await User.create({
          email: payload.email,
          name: payload.name,
          googleId: payload.sub,
          profilePicture: payload.picture,
          isEmailVerified: true, // Google emails are verified
          password: crypto.randomBytes(20).toString('hex'), // Random password for Google users
          googleRefreshToken: googleTokens.refresh_token,
          isGoogleCalendarConnected: !!googleTokens.refresh_token,
        });
      } else {
        // Update existing user's Google data
        user.googleId = payload.sub;
        user.isEmailVerified = true;
        if (payload.picture) user.profilePicture = payload.picture;

        // Only update refresh token if we received a new one
        if (googleTokens.refresh_token) {
          user.googleRefreshToken = googleTokens.refresh_token;
          user.isGoogleCalendarConnected = true;
        } else if (!user.googleRefreshToken) {
          // If we don't have a refresh token stored and didn't get a new one,
          // we can't connect to Google Calendar
          user.isGoogleCalendarConnected = false;
        }

        await user.save();
      }

      // Generate JWT token
      const token = AuthService.generateToken(user);

      return {
        user: user.getPublicProfile(),
        token,
      };
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw new AuthenticationError('Google authentication failed');
    }
  }

  /**
   * Verify Email
   */
  public async verifyEmail(token: string): Promise<{ message: string }> {
    // Hash token for comparison
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with token
    const user = await User.findOne({
      verificationToken: hashedToken,
    });

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    // Update user
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  /**
   * Request Password Reset
   */
  public async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new NotFoundError('No user found with this email');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await user.save();

    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: `To reset your password, click: ${resetUrl}`,
        html: `
            <div>
              <h1>Password Reset Request</h1>
              <p>Click the link below to reset your password:</p>
              <a href="${resetUrl}">Reset Password</a>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          `,
      });

      return { message: 'Password reset email sent' };
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      throw new Error('Error sending password reset email');
    }
  }

  /**
   * Reset Password
   */
  public async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Hash token for comparison
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return { message: 'Password reset successful' };
  }

  /**
   * Validate Token
   */
  public async validateToken(token: string): Promise<{ valid: boolean; user?: any }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      const user = await User.findById(decoded.userId);

      if (!user) {
        return { valid: false };
      }

      return {
        valid: true,
        user: user.getPublicProfile(),
      };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Change Password
   */
  public async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  }
}

export default AuthService;

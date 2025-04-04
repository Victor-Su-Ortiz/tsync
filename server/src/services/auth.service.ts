import User from '../models/user.model';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
// import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { sendEmail } from '../utils/email';
import { AuthenticationError, ValidationError, NotFoundError } from '../utils/errors';
import GoogleAuthService from './google-auth.service';
import { GoogleService } from './google.services';

// Types
export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: any;
  token: string;
}

export class AuthService {
  private static readonly googleClient = GoogleService.getInstance().getOAuth2Client();

  /**
   * Generate a profile picture for payload
   */
  private static async setProfilePicture(payload: any) {
    const userId = payload.sub;
    // Use the access token to get profile info including picture
    const people = google.people({ version: 'v1', auth: this.googleClient });
    const profile = await people.people.get({
      resourceName: `people/${userId}`,
      personFields: 'photos',
    });
    payload.picture = profile.data.photos?.[0].url ?? undefined;
  }

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
  public static async register(userData: RegisterUserInput): Promise<AuthResponse> {
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
      // const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
      // await sendEmail({
      //   to: user.email,
      //   subject: "Please verify your email",
      //   text: `Click the link to verify your email: ${verificationUrl}`,
      //   html: `
      //     <div>
      //       <h1>Welcome to ${process.env.APP_NAME}!</h1>
      //       <p>Please click the link below to verify your email:</p>
      //       <a href="${verificationUrl}">Verify Email</a>
      //     </div>
      //   `,
      // });
    } catch (error) {
      // If email fails, still create user but log error
      console.error('Verification email failed:', error);
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      user: user.getPublicProfile(),
      token,
    };
  }

  /**
   * Login user
   */
  public static async login(loginData: LoginInput): Promise<AuthResponse> {
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
    const token = this.generateToken(user);

    return {
      user: user.getPublicProfile(),
      token,
    };
  }

  /**
   * Google OAuth Authentication
   */
  public static async googleAuth(
    idToken: string,
    accessToken: string,
    code: string
  ): Promise<AuthResponse> {
    try {
      // Store tokens.refresh_token securely
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new AuthenticationError('Invalid Google token');
      }

      // Set the token on your existing client

      const googleTokens = await GoogleAuthService.generateTokens(code);
      if (!googleTokens.refresh_token) {
        throw new AuthenticationError('Failed to get refresh token');
      }

      this.googleClient.setCredentials({
        access_token: accessToken,
        refresh_token: googleTokens.refresh_token,
      });

      if (!payload.picture) {
        await this.setProfilePicture(payload);
      }

      // Find or create user
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
          isGoogleCalendarConnected: true,
        });
      } else {
        // Update existing user's Google data
        user.googleId = payload.sub;
        user.isEmailVerified = true;
        if (payload.picture) user.profilePicture = payload.picture;
        // set the refresh token
        user.googleRefreshToken = googleTokens.refresh_token;
        user.isGoogleCalendarConnected = true;
        await user.save();
      }

      // Generate token
      const token = this.generateToken(user);

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
  public static async verifyEmail(token: string): Promise<{ message: string }> {
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
  public static async requestPasswordReset(email: string): Promise<{ message: string }> {
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
  public static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
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
  public static async validateToken(token: string): Promise<{ valid: boolean; user?: any }> {
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
  public static async changePassword(
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

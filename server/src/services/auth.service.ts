import User from '../models/user.model';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
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
  private static async setProfilePicture(payload: any, accessToken: string) {
    const userId = payload.sub;
    // Create a new OAuth2 client with the access token specifically for this request
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    // Use the access token to get profile info including picture
    const people = google.people({ version: 'v1', auth: oauth2Client });
    try {
      const profile = await people.people.get({
        resourceName: `people/${userId}`,
        personFields: 'photos',
      });
      payload.picture = profile.data.photos?.[0].url ?? undefined;
    } catch (error) {
      console.error('Error fetching profile picture:', error);
      // Continue without picture if there's an error
    }
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
      // Step 1: Verify the ID token to ensure it's valid
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new AuthenticationError('Invalid Google token');
      }

      // Step 2: Exchange the authorization code for tokens
      // This needs to happen BEFORE using the tokens
      let googleTokens;
      try {
        googleTokens = await GoogleAuthService.generateTokens(code);

        // Log the tokens for debugging (remove in production)
        console.log('Google Tokens:', {
          access_token: googleTokens.access_token ? 'Present' : 'Missing',
          refresh_token: googleTokens.refresh_token ? 'Present' : 'Missing',
          expires_in: googleTokens.expires_in
        });

        // Ensure we have refresh token - for first-time auth only
        if (!googleTokens.refresh_token) {
          console.warn('No refresh token received from Google. User may need to revoke access and re-authorize.');
          // Continue anyway - user might have previously authorized the app
        }
      } catch (tokenError) {
        console.error('Error exchanging code for tokens:', tokenError);
        throw new AuthenticationError('Failed to exchange authorization code');
      }

      // Step 3: Set the credentials on the client
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: googleTokens.access_token || accessToken,
        refresh_token: googleTokens.refresh_token,
        expiry_date: googleTokens.expires_in ? Date.now() + googleTokens.expires_in * 1000 : undefined
      });

      // Step 4: Fetch profile picture if not present in ID token
      if (!payload.picture) {
        await this.setProfilePicture(payload, googleTokens.access_token || accessToken);
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

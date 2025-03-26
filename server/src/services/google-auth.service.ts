import { NotFoundError, ValidationError } from '../utils/errors';
// src/services/google-auth.service.ts
import { google } from 'googleapis';
import { OAuthState } from '../models/OAuth.model';
import User from '../models/user.model';
import crypto from 'crypto';

export default class GoogleAuthService {
  /**
   * Create OAuth2 client for Google API
   */
  private static createOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  public static async generateTokens(code: string) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID as string,
          client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
          grant_type: 'authorization_code',
        }),
      });
      const tokens = await response.json();
      return tokens;
    } catch (error) {
      console.error('Error generating Google auth URL:', error);
      throw error;
    }
  }

  /**
   * Generate authorization URL for Google Calendar API
   */
  public static async generateAuthUrl(userId: string) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const oauth2Client = this.createOAuth2Client();

      // Generate a random state value to prevent CSRF attacks
      const state = crypto.randomBytes(32).toString('hex');

      // Store state with user ID
      await OAuthState.create({
        state,
        userId: user._id,
      });

      // Define scopes needed for calendar access
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'profile',
        'email',
      ];

      // Generate auth URL
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // This is crucial for getting a refresh token
        prompt: 'consent', // Force to display the consent screen
        scope: scopes,
        state: state, // Pass state for validation in callback
      });

      return { authUrl };
    } catch (error) {
      console.error('Error generating Google auth URL:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and get refresh token
   */
  public static async handleAuthCallback(code: string, state: string) {
    try {
      // Verify state to prevent CSRF attacks
      const storedState = await OAuthState.findOne({ state });

      if (!storedState) {
        throw new ValidationError('Invalid or expired state parameter');
      }

      const userId = storedState.userId;

      // Delete the used state
      await OAuthState.deleteOne({ _id: storedState._id });

      // Exchange code for tokens
      const oauth2Client = this.createOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code);

      // Check if refresh token was provided
      if (!tokens.refresh_token) {
        throw new ValidationError(
          'No refresh token received. Please revoke app access in your Google account and try again.'
        );
      }

      // Store the refresh token for the user
      const user = await User.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      user.googleRefreshToken = tokens.refresh_token;
      user.isGoogleCalendarConnected = true;

      // Optionally store token expiry info
      if (tokens.expiry_date) {
        user.googleTokenExpiry = new Date(tokens.expiry_date);
      }

      await user.save();

      // Also store user info from Google if available
      if (tokens.id_token) {
        oauth2Client.setCredentials(tokens);
        // const peopleApi = google.people({ version: 'v1', auth: oauth2Client });

        try {
          // const profile = await peopleApi.people.get({
          //   resourceName: 'people/me',
          //   personFields: 'names,emailAddresses,photos',
          // });
          // Update user profile with Google info if needed
          // This is optional and depends on your app requirements
        } catch (profileError) {
          console.error('Error fetching Google profile:', profileError);
          // Continue anyway since we have the refresh token
        }
      }

      return {
        success: true,
        message: 'Google Calendar connected successfully',
        userId: userId.toString(),
      };
    } catch (error) {
      console.error('Error handling Google OAuth callback:', error);
      throw error;
    }
  }


}

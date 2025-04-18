// src/services/google.service.ts
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { google, calendar_v3 } from 'googleapis';

/**
 * Centralized service for Google API interactions
 */
export class GoogleService {
  static createOauth2Client() {
    return new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Verify Google ID token
   */
  public static async verifyIdToken(idToken: string): Promise<TokenPayload | null> {
    try {
      const ticket = await this.createOauth2Client().verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      return ticket.getPayload() || null;
    } catch (error) {
      console.error('Error verifying Google token:', error);
      throw new Error('Failed to verify Google token');
    }
  }

  /**
   * Generate a profile picture for payload
   */
  public static async setProfilePicture(payload: any, googleClient: OAuth2Client) {
    const userId = payload.sub;
    // Use the access token to get profile info including picture
    const people = google.people({ version: 'v1', auth: googleClient });
    const profile = await people.people.get({
      resourceName: `people/${userId}`,
      personFields: 'photos',
    });
    payload.picture = profile.data.photos?.[0].url ?? undefined;
  }

  /**
   * Create OAuth client with user credentials
   */
  // public setOauthCredentials(tokens: {
  //   access_token?: string;
  //   refresh_token?: string;
  //   expiry_date?: number;
  // }): void {
  //   // const userClient = new OAuth2Client(
  //   //   process.env.GOOGLE_CLIENT_ID,
  //   //   process.env.GOOGLE_CLIENT_SECRET,
  //   //   process.env.GOOGLE_REDIRECT_URI
  //   // );

  //   this.oAuth2Client.setCredentials({
  //     access_token: tokens.access_token,
  //     refresh_token: tokens.refresh_token,
  //     expiry_date: tokens.expiry_date,
  //   });
  // }

  /**
   * Get Google Calendar API client for a specific user
   */
  public getCalendarClient(userOAuth2Client: OAuth2Client): calendar_v3.Calendar {
    return google.calendar({ version: 'v3', auth: userOAuth2Client });
  }

  /**
   * Generate OAuth URL for requesting user consent
   */
  // public generateAuthUrl(scopes: string[]): string {
  //   return this.oAuth2Client.generateAuthUrl({
  //     access_type: 'offline',
  //     prompt: 'consent',
  //     scope: scopes,
  //   });
  // }

  /**
   * Exchange authorization code for tokens
   */
  //   public async getTokensFromCode(code: string): Promise<{
  //     access_token?: string;
  //     refresh_token?: string;
  //     expiry_date?: number;
  //     scope?: string;
  //   }> {
  //     try {
  //       const { tokens } = await this.oAuth2Client.getToken(code);
  //       return tokens;
  //     } catch (error) {
  //       console.error('Error getting tokens from code:', error);
  //       throw new Error('Failed to exchange authorization code');
  //     }
  //   }

  /**
   * Refresh access token using refresh token
   */
  // public async refreshAccessToken(refreshToken: string): Promise<string | null> {
  //   try {
  //     this.oAuth2Client.setCredentials({
  //       refresh_token: refreshToken,
  //     });

  //     const { credentials } = await this.oAuth2Client.refreshAccessToken();
  //     return credentials.access_token || null;
  //   } catch (error) {
  //     console.error('Error refreshing access token:', error);
  //     throw new Error('Failed to refresh access token');
  //   }
  // }
}

// export default GoogleService.getInstance();

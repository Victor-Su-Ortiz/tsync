// src/services/google-auth.service.ts
import { google } from 'googleapis';
import User from '../models/user.model';
import { NotFoundError, ValidationError } from '../utils/errors';
import crypto from 'crypto';

// Define a model for storing OAuth state
import mongoose, { Schema } from 'mongoose';

interface IOAuthState extends Document {
  state: string;
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
}

const oauthStateSchema = new Schema<IOAuthState>({
  state: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // State expires after 10 minutes
    default: () => new Date(Date.now() + 10 * 60 * 1000),
  },
});

// Add index for auto-expiration
oauthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OAuthState = mongoose.model<IOAuthState>('OAuthState', oauthStateSchema);
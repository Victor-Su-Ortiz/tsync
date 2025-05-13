// src/tests/setup.ts
import dotenv from 'dotenv';

// Load environment variables
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Request, Response, NextFunction } from 'express';
import { beforeAll, afterAll, jest, afterEach } from '@jest/globals';

let mongoServer: MongoMemoryServer;

jest.mock('../src/controllers/auth.controller');
jest.mock('../src/middleware/validation.middleware', () => ({
  validateRequest: jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => next()),
}));
// jest.mock('../src/validations/auth.validation', () => ({
//   authValidation: {
//     register: jest.fn()
//   }
// }));

beforeAll(async () => {
  // Load test environment variables
  dotenv.config({ path: '.env.test' });

  // Create an in-memory MongoDB server for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Connect to the in-memory database
  await mongoose.connect(mongoUri);
  console.log('🟢 Test MongoDB connected');
});

afterAll(async () => {
  // Disconnect and stop the in-memory database
  await mongoose.disconnect();
  await mongoServer.stop();

  // Clear all mocks
  jest.clearAllMocks();

  console.log('✅ Tests completed, MongoDB connection closed.');
  // process.env.GOOGLE_CLIENT_ID = undefined;
});

afterEach(() => {
  jest.restoreAllMocks();
});

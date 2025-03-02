// src/tests/setup.ts
import dotenv from 'dotenv';

// Load environment variables
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Request, Response, NextFunction } from 'express';
import { beforeAll, afterAll, jest } from '@jest/globals';

let mongoServer: MongoMemoryServer;

jest.mock('../src/controllers/auth.controller');
jest.mock('../src/middleware/validation.middleware', () => ({
  validateRequest: jest.fn(() => (_req: Request, _res: Response, next: NextFunction) => next())
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

  // Set up any test environment variables needed for auth
  // process.env.JWT_SECRET = 'f23505b4f271f2d3ddcaf0ffd2dcdfb074f29cecf248c914c3e0b5c6a0a9cedc43f92c526386a075e903a5db6fcab1a6ed9fbb23bf42af9353b31c6001099bed';
  // process.env.JWT_EXPIRES_IN = '1h';
  // process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
});

afterAll(async () => {
  // Disconnect and stop the in-memory database
  await mongoose.disconnect();
  await mongoServer.stop();
  
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset environment variables
  // process.env.JWT_SECRET = undefined;
  // process.env.JWT_EXPIRES_IN = undefined;
  // console.log('✅ Tests completed, MongoDB connection closed.');
  // process.env.GOOGLE_CLIENT_ID = undefined;
});

afterEach(() => {
  jest.restoreAllMocks()
})
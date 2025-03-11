import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

/**
 * Creates a mock Express Request object
 */
export const mockRequest = (): Partial<Request> => {
  const req: Partial<Request> = {};
  req.body = {};
  req.params = {};
  req.query = {};
  req.headers = {
    authorization: undefined
  };
  req.userId = undefined; // For custom auth middleware
  return req;
};

/**
 * Creates a mock Express Response object with Jest spy functions
 */
export const mockResponse = () => {
  const res: any = {};
  
  // Mock all the response methods with appropriate parameter types
  res.status = jest.fn((code: number) => res);
  res.json = jest.fn((data: any) => res);
  res.send = jest.fn((body: any) => res);
  res.sendStatus = jest.fn((code: number) => res);
  res.setHeader = jest.fn((name: string, value: string) => res);
  res.cookie = jest.fn((name: string, value: string, options?: any) => res);
  res.clearCookie = jest.fn((name: string, options?: any) => res);
  res.redirect = jest.fn((url: string) => res);
  res.render = jest.fn((view: string, locals?: any) => res);
  res.end = jest.fn(() => res);
  
  return res as Partial<Response>;
};

/**
 * Creates a mock Express NextFunction
 */
export const mockNext = (): NextFunction => {
  return jest.fn();
};

/**
 * Helper to create a complete set of Express mocks
 */
export const mockExpressItems = () => {
  return {
    req: mockRequest(),
    res: mockResponse(),
    next: mockNext()
  };
};

// Declare module augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
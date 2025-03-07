import { Request, Response } from 'express';
import { jest } from '@jest/globals';
import { ResolveFnOutput } from 'module';

/**
 * Creates a mock Express Request object
 */
export const mockRequest = (): Partial<Request> => {
    const req: Partial<Request> = {};
    req.body = {};
    req.params = {};
    req.query = {};
    req.headers = {};
    return req;
  };
  
  /**
   * Creates a mock Express Response object with Jest spy functions
   */
 export const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    // Create properly typed mock functions
    // Status method
    // Status method
    res.status
  res.status = jest.fn().mockImplementation((code: number) => res as Response);
  
  // JSON method
  res.json = jest.fn().mockReturnThis();
  
  // Send method
  res.send = jest.fn().mockReturnThis();
  
  // Additional common methods
  res.sendStatus = jest.fn().mockReturnThis();
  res.setHeader = jest.fn().mockReturnThis();
  res.cookie = jest.fn().mockReturnThis();
  res.clearCookie = jest.fn().mockReturnThis();
  res.redirect = jest.fn().mockReturnThis();
  res.render = jest.fn().mockReturnThis();
  res.end = jest.fn().mockReturnThis();
    
    return res as Response;
  };
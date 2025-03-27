// src/middleware/request-counter.middleware.ts

import { Request, Response, NextFunction } from 'express';

// Simple in-memory counter
let requestCount = 0;
const requestStats: Record<string, number> = {};

export const requestCounter = (req: Request, _res: Response, next: NextFunction) => {
  // Increment total count
  requestCount++;
  
  // Track by endpoint
  const endpoint = `${req.method} ${req.originalUrl.split('?')[0]}`;
  requestStats[endpoint] = (requestStats[endpoint] || 0) + 1;
  
  next();
};

// Endpoints to get statistics
export const getRequestStats = (_req: Request, res: Response) => {
  res.status(200).json({
    totalRequests: requestCount,
    byEndpoint: requestStats
  });
};

// Reset counters (optional, for testing)
export const resetRequestStats = (_req: Request, res: Response) => {
  requestCount = 0;
  Object.keys(requestStats).forEach(key => {
    requestStats[key] = 0;
  });
  
  res.status(200).json({
    message: 'Request statistics have been reset'
  });
};
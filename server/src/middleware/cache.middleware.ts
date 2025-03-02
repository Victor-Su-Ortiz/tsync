import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';

// Create cache instance
const appCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false // Don't clone objects when getting/setting
});

/**
 * Parse duration string to seconds
 * @param duration Duration string (e.g., '5m', '1h')
 * @returns Duration in seconds
 */
const parseDuration = (duration: string): number => {
  const value = parseInt(duration.slice(0, -1), 10);
  const unit = duration.slice(-1);
  
  switch (unit) {
    case 's': return value; // seconds
    case 'm': return value * 60; // minutes
    case 'h': return value * 60 * 60; // hours
    case 'd': return value * 60 * 60 * 24; // days
    default: return 300; // default 5 minutes
  }
};

/**
 * Generate cache key from request
 * @param req Express request
 * @returns Cache key
 */
const generateCacheKey = (req: Request): string => {
  // Create key based on HTTP method, URL path, query params, and user ID
  const method = req.method;
  const path = req.path;
  const query = JSON.stringify(req.query);
  const userId = req.userId || 'anonymous';
  
  return `${method}:${path}:${query}:${userId}`;
};

/**
 * Express middleware for caching responses
 * @param duration Cache duration (e.g., '5m', '1h')
 * @returns Express middleware function
 */
export const cache = (duration: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip cache for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Generate cache key
    const key = generateCacheKey(req);
    
    // Check if response exists in cache
    const cachedResponse = appCache.get(key);
    if (cachedResponse) {
      // Return cached response
      return res.status(200).json(cachedResponse);
    }
    
    // If not in cache, capture the response
    const originalSend = res.json;
    res.json = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Convert duration string to seconds
        const ttl = parseDuration(duration);
        
        // Store in cache
        appCache.set(key, body, ttl);
      }
      
      // Call original json method
      return originalSend.call(this, body);
    };
    
    next();
  };
};

/**
 * Clear cache for a specific pattern
 * @param pattern Key pattern to clear
 */
export const clearCache = (pattern: string): void => {
  const keys = appCache.keys();
  const matchedKeys = keys.filter(key => key.includes(pattern));
  
  if (matchedKeys.length > 0) {
    appCache.del(matchedKeys);
  }
};

export default {
  cache,
  clearCache
};
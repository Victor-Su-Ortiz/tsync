import { Types, Document } from 'mongoose';

// Correctly extending Express namespace
declare global {
  namespace Express {
    interface Request {
      userId?: Types.ObjectId;
    }
  }
}

// Required for this file to be treated as a module
export {};
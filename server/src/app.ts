import express, {
  Application,
  Request,
  Response,
  NextFunction,
  // ErrorRequestHandler,
} from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
// import { rateLimit } from "express-rate-limit";
import path from 'path';

// Routes
import authRoutes from './routes/auth.routes';
import friendRoutes from './routes/friends.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import eventRoutes from './routes/event.routes';
import calendarRoutes from './routes/calendar.routes';
import GeminiRoutes from './routes/gemini.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './utils/errors';
import {
  requestCounter,
  getRequestStats,
  resetRequestStats,
} from './middleware/counter.middleware';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRequestMonitoring();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Security Middleware
    this.app.use(helmet()); // Set security HTTP headers
    this.app.use(
      cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      })
    );
    this.app.use(mongoSanitize()); // Sanitize data against NoSQL injection

    // Request Parsing
    this.app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    this.app.use(cookieParser()); // Parse Cookie header and populate req.cookies

    // Performance Middleware
    this.app.use(compression()); // Compress response bodies

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    // Rate limiting
    // const limiter = rateLimit({
    //   max: 100, // Limit each IP to 100 requests per window
    //   windowMs: 60 * 60 * 1000, // 1 hour window
    //   message: "Too many requests from this IP, please try again in an hour!",
    // });
    // this.app.use("/api", limiter);

    // Serve static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  }
  private configureRequestMonitoring(): void {
    // Apply the request counter middleware to all routes
    this.app.use(requestCounter);

    // Add routes to view request statistics
    this.app.get('/api/v1/monitoring/stats', getRequestStats);
    this.app.post('/api/v1/monitoring/reset', resetRequestStats);
  }

  private configureRoutes(): void {
    // Health check
    this.app.get('/health', (_: Request, res: Response) => {
      res.status(200).json({
        status: 'success',
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
      });
    });

    // API routes
    this.app.use('/api/v1/auth', authRoutes);
    this.app.use('/api/v1/friends', friendRoutes);
    this.app.use('/api/v1/users', userRoutes);
    this.app.use('/api/v1/notifications', notificationRoutes);
    this.app.use('/api/v1/events', eventRoutes);
    this.app.use('/api/v1/calendar', calendarRoutes);
    this.app.use('/api/v1/gemini', GeminiRoutes);

    // Handle undefined routes
    this.app.all('*', (req: Request, _: Response, next: NextFunction) => {
      next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
    });
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler.handleError);
  }
}

export default new App().app;

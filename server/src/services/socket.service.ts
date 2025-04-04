// src/services/socket.service.ts
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import User from '../models/user.model';

export class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;
  // Map to store active user connections: userId -> socketId
  private userSockets: Map<string, Set<string>> = new Map();

  private constructor() { }

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Setup Redis adapter for horizontal scaling (optional)
    if (process.env.REDIS_URL) {
      this.setupRedisAdapter();
    }

    // Socket authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.userId = decoded.userId;

        // Verify user exists
        const userExists = await User.exists({ _id: decoded.userId });
        if (!userExists) return next(new Error('User not found'));

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    console.log('Socket.IO server initialized');
  }

  private async setupRedisAdapter(): Promise<void> {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      this.io?.adapter(createAdapter(pubClient, subClient));
      console.log('Redis adapter for Socket.IO configured');
    } catch (error) {
      console.error('Redis adapter setup failed:', error);
    }
  }

  private handleConnection(socket: Socket): void {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}, SocketID: ${socket.id}`);

    // Add user to online users map
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)?.add(socket.id);

    // Join a personal room for targeted messages
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      // Remove from tracking
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    });
  }

  /**
   * Send a notification to a specific user
   */
  public sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;

    console.log(`[Socket] Emitting ${event} to user ${userId}`, data);

    // Log all active connections for debugging
    const activeConnections = this.io.sockets.adapter.rooms.size;
    console.log(`[Socket] Active connections: ${activeConnections}`);

    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Check if a user is online
   */
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && (this.userSockets.get(userId)?.size || 0) > 0;
  }

  /**
   * Send to all connected clients
   */
  public broadcast(event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, data);
  }

  /**
   * Get socket.io server instance
   */
  public getIO(): Server | null {
    return this.io;
  }
}

export default SocketService.getInstance();

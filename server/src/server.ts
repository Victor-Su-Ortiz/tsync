import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "./app";
import http from "http";
import socketService from "./services/socket.service";

// Load environment variables
dotenv.config();

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Database connection
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!, {
      // The following options are no longer needed in newer versions of Mongoose
      // but kept here for reference
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Add MongoDB logging in development
    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", true);
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Server configuration
const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);
    
    // Initialize socket.io
    socketService.initialize(server);

    server.listen(PORT, () => {
      console.log(`
        ################################################
        🛡️  Server listening on port: ${PORT} 🛡️
        ################################################
      `);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err: Error) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...");
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle SIGTERM signal
    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
      server.close(() => {
        console.log("💥 Process terminated!");
      });
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

// Start the server
startServer();

// For testing purposes
export default app;

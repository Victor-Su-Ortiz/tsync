import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model";
dotenv.config();

// Assert that MONGODB_URI exists and is a string
// Fix: Provide a default value
const MONGODB_URI: string = process.env.MONGODB_URI ?? "";

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

async function deleteUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    // Delete all users
    await User.deleteMany({});

    console.log("All users deleted successfully");
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
  }
}

deleteUsers();

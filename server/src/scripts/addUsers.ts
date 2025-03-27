import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model";

// Load environment variables
dotenv.config();

// Assert that MONGODB_URI exists and is a string
// Fix: Provide a default value
const MONGODB_URI: string = process.env.MONGODB_URI ?? "";

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// Now TypeScript knows MONGODB_URI is definitely a string
console.log("Attempting to connect to MongoDB...");

const users = [
  {
    name: "John Doe",
    email: "john.doe@example.com",
    password: "Password123!",
    role: "user",
    profilePicture: "default-avatar.png",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-01"),
  },
  {
    name: "Jane Smith",
    email: "jane.smith@example.com",
    password: "Password456!",
    role: "admin",
    profilePicture: "default-avatar.png",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-05"),
  },
  {
    name: "Bob Wilson",
    email: "bob.wilson@example.com",
    password: "Password789!",
    role: "user",
    googleId: "123456789",
    profilePicture: "default-avatar.png",
    isEmailVerified: false,
    lastLogin: null,
  },
  {
    name: "Alice Brown",
    email: "alice.brown@example.com",
    password: "PasswordABC!",
    role: "user",
    profilePicture: "default-avatar.png",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-10"),
  },
  {
    name: "Charlie Davis",
    email: "charlie.davis@example.com",
    password: "PasswordXYZ!",
    role: "user",
    googleId: "987654321",
    profilePicture: "default-avatar.png",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-08"),
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB with explicit options
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log("Successfully connected to MongoDB");

    // Clear existing users
    const deleteResult = await User.deleteMany({});
    console.log("Cleared existing users:", deleteResult);

    // Insert new users
    const createdUsers = [];

    for (const userData of users) {
      try {
        // Create user without manually hashing the password
        // Let the model's pre-save middleware handle it
        const user = new User(userData);
        const savedUser = await user.save();

        console.log(
          `Created user: ${userData.email} with ID: ${savedUser._id}`
        );
        createdUsers.push(savedUser);
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }

    console.log(`Successfully created ${createdUsers.length} users`);

    // Verify the users exist
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    try {
      await mongoose.connection.close();
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
    process.exit(0);
  }
}

// Run the seeder
seedDatabase();

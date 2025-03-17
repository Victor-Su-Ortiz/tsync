import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model";

// Load environment variables
dotenv.config();

// Assert that MONGODB_URI exists and is a string
const MONGODB_URI: string = process.env.MONGODB_URI ?? "";

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

// Now TypeScript knows MONGODB_URI is definitely a string
console.log("Attempting to connect to MongoDB...");

const users = [
  {
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    password: "Password123!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/women/1.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-12"),
  },
  {
    name: "Michael Smith",
    email: "michael.smith@example.com",
    password: "Password456!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/men/1.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-15"),
  },
  {
    name: "Sophia Williams",
    email: "sophia.williams@example.com",
    password: "Password789!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/women/2.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-18"),
  },
  {
    name: "James Brown",
    email: "james.brown@example.com",
    password: "PasswordABC!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/men/2.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-20"),
  },
  {
    name: "Olivia Davis",
    email: "olivia.davis@example.com",
    password: "PasswordXYZ!",
    role: "user",
    profilePicture: "https://randomuser.me/api/portraits/women/3.jpg",
    isEmailVerified: true,
    lastLogin: new Date("2024-02-22"),
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

    // Create friend relationships - make all users friends with each other
    console.log("Creating friend relationships...");

    for (let i = 0; i < createdUsers.length; i++) {
      const currentUser = createdUsers[i];
      const friendIds = [];

      // Add all other users as friends
      for (let j = 0; j < createdUsers.length; j++) {
        if (i !== j) { // Don't add self as friend
          friendIds.push(createdUsers[j]._id);
        }
      }

      // Update user with friends
      try {
        await User.findByIdAndUpdate(
          currentUser._id,
          { $set: { friends: friendIds } }
        );
        console.log(`Added ${friendIds.length} friends to user: ${currentUser.email}`);
      } catch (error) {
        console.error(`Error adding friends to user ${currentUser.email}:`, error);
      }
    }

    // Verify the friend relationships
    for (const user of createdUsers) {
      const refreshedUser = await User.findById(user._id).populate('friends', 'name email');
      if (refreshedUser) {
        console.log(`User ${refreshedUser.name} has ${refreshedUser.friends?.length || 0} friends`);
      } else {
        console.log(`User with ID ${user._id} was not found`);
      }
    }

    // Print login credentials
    console.log("\nUser Login Credentials:");
    console.log("======================");

    for (const user of createdUsers) {
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: Password found in the seeding script`);
      console.log(`ID: ${user._id}`);
      console.log("----------------------");
    }

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
import User from "../models/user.model";
import crypto from "crypto";
import { sendEmail } from "../utils/email";
import { NotFoundError } from "../utils/errors";

export class UserService {
  /**
   * Send verification email for updated email address
   */
  public static async sendVerificationEmail(userId: string, newEmail: string): Promise<boolean> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Update user with new token
    user.verificationToken = hashedVerificationToken;
    await user.save();

    try {
      // Construct verification URL
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
      
      // Send verification email
      await sendEmail({
        to: newEmail,
        subject: "Verify your new email address",
        text: `Please click the link to verify your new email address: ${verificationUrl}`,
        html: `
          <div>
            <h1>Email Verification</h1>
            <p>We noticed you've updated your email address on your account.</p>
            <p>Please click the link below to verify this new email address:</p>
            <a href="${verificationUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
            <p>If you didn't request this change, please secure your account immediately.</p>
          </div>
        `,
      });

      return true;
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }

  /**
   * Get user analytics data
   */
  public static async getUserAnalytics(): Promise<any> {
    const total = await User.countDocuments();
    const verified = await User.countDocuments({ isEmailVerified: true });
    const googleUsers = await User.countDocuments({ googleId: { $exists: true, $ne: null } });
    const admins = await User.countDocuments({ role: "admin" });
    
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    
    const newLastWeek = await User.countDocuments({ 
      createdAt: { $gte: lastWeekDate }
    });
    
    const activeLastWeek = await User.countDocuments({ 
      lastLogin: { $gte: lastWeekDate }
    });

    return {
      total,
      verified,
      googleUsers,
      admins,
      newLastWeek,
      activeLastWeek,
      verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0
    };
  }

  /**
   * Search users by name or email
   */
  public static async searchUsers(query: string, limit: number = 10): Promise<any[]> {
    if (!query || query.length < 3) {
      return [];
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
    .select("_id name email profilePicture")
    .limit(limit);
    
    return users;
  }

  /**
   * Get users with friend status for current user
   */
//   public static async getUsersWithFriendStatus(userId: string, page: number = 1, limit: number = 10): Promise<any> {
//     const currentUser = await User.findById(userId);
//     if (!currentUser) {
//       throw new NotFoundError("User not found");
//     }

//     const skip = (page - 1) * limit;
    
//     // Get users
//     const users = await User.find({ _id: { $ne: userId } })
//       .select("_id name email profilePicture")
//       .skip(skip)
//       .limit(limit);
    
//     const friendIds = new Set(currentUser.friends.map(id => id.toString()));
    
//     // Map pending requests by from user ID
//     const pendingRequests = new Map();
//     currentUser.friendRequests.forEach(request => {
//       if (request.status === 'pending') {
//         pendingRequests.set(request.from.toString(), request._id);
//       }
//     });
    
//     // Enhanced users with friend status
//     const enhancedUsers = users.map(user => {
//       const userObject = user.toObject();
      
//       // Determine friend status
//       if (friendIds.has(user._id.toString())) {
//         userObject.friendStatus = 'friends';
//       } else if (pendingRequests.has(user._id.toString())) {
//         userObject.friendStatus = 'request-received';
//         userObject.requestId = pendingRequests.get(user._id.toString());
//       } else {
//         // To determine if current user sent request, we need to check target user's friend requests
//         userObject.friendStatus = 'not-friends';
//       }
      
//       return userObject;
//     });
    
//     const total = await User.countDocuments({ _id: { $ne: userId } });
    
//     return {
//       users: enhancedUsers,
//       pagination: {
//         total,
//         page,
//         pages: Math.ceil(total / limit),
//         limit
//       }
//     };
//   }
}

export default UserService;
import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import { AuthService } from "../services/auth.service";
import { UserService } from "../services/user.service";
import { cloudUpload, deleteFromCloud } from "../utils/cloudStorage";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";

export class UserController {

    // Search users
  static async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, limit = 10 } = req.query;
      console.log("hfodfdhodfdhfklhjdfhskfn", q)
      
      if (!q || typeof q !== 'string') {
        throw new BadRequestError('Search query is required');
      }
      
      const users = await UserService.searchUsers(
        q, 
        Number(limit),
        req.userId!.toString()
      );
      
      res.status(200).json({ users });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      
      res.status(200).json({
        success: true,
        data: user.getPublicProfile()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // Prevent updating sensitive fields
      const allowedUpdates = ["name", "email"];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {} as Record<string, any>);
      
      // If email is being updated, mark as unverified
      if (updates.email) {
        updates.isEmailVerified = false;
        
        // Generate and send verification email
        // This would need implementation in UserService
        await UserService.sendVerificationEmail(req.userId!.toString(), updates.email);
      }
      
      const user = await User.findByIdAndUpdate(
        req.userId,
        updates,
        { new: true, runValidators: true }
      );
      
      if (!user) {
        throw new NotFoundError("User not found");
      }
      
      res.status(200).json({
        success: true,
        data: user.getPublicProfile(),
        message: updates.email ? 
          "Profile updated. Please verify your new email address." : 
          "Profile updated successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user profile
   */
  static async deleteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      
      // Delete profile picture from cloud storage if exists
      if (user.profilePicture) {
        try {
          await deleteFromCloud(user.profilePicture);
        } catch (error) {
          console.error("Error deleting profile picture:", error);
          // Continue with account deletion even if image deletion fails
        }
      }
      
      // Delete user account
      await User.findByIdAndDelete(req.userId);
      
      res.status(200).json({
        success: true,
        message: "Account deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile picture
   */
  static async updateProfilePicture(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if file exists
      if (!req.file) {
        throw new Error("Please upload an image");
      }
      
      const user = await User.findById(req.userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }
      
      // Delete previous profile picture if exists
      if (user.profilePicture) {
        try {
          await deleteFromCloud(user.profilePicture);
        } catch (error) {
          console.error("Error deleting previous profile picture:", error);
          // Continue with upload even if previous image deletion fails
        }
      }
      
      // Upload new profile picture
      const result = await cloudUpload(req.file.path, `users/${req.userId}/profile`);
      
      // Update user profile
      user.profilePicture = result.secure_url;
      await user.save();
      
      res.status(200).json({
        success: true,
        data: {
          profilePicture: result.secure_url
        },
        message: "Profile picture updated successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const result = await AuthService.changePassword(
        req.userId!.toString(),
        currentPassword,
        newPassword
      );
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get all users
   */
  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // Build query with pagination and filtering
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      
      // Filter options
      const filter: Record<string, any> = {};
      if (req.query.role) filter.role = req.query.role;
      if (req.query.isEmailVerified) filter.isEmailVerified = req.query.isEmailVerified === 'true';
      
      // Execute query
      const users = await User.find(filter)
        .select("-password -resetPasswordToken -resetPasswordExpire -verificationToken")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
      
      const total = await User.countDocuments(filter);
      
      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Create new user
   */
  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      // Create user with admin privileges
      const userData = {
        ...req.body,
        // Set default values for admin-created accounts
        isEmailVerified: true // Admin-created accounts don't need verification
      };
      
      const user = await User.create(userData);
      
      res.status(201).json({
        success: true,
        data: user.getPublicProfile()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get user by ID
   */
  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id)
        .select("-password -resetPasswordToken -resetPasswordExpire -verificationToken");
      
      if (!user) {
        throw new NotFoundError("User not found");
      }
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update user
   */
  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      // Allow admins to update any field except password
      const updates = { ...req.body };
      delete updates.password;
      
      const user = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).select("-password -resetPasswordToken -resetPasswordExpire -verificationToken");
      
      if (!user) {
        throw new NotFoundError("User not found");
      }
      
      res.status(200).json({
        success: true,
        data: user,
        message: "User updated successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Delete user
   */
  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id);
      
      if (!user) {
        throw new NotFoundError("User not found");
      }
      
      // Prevent self-deletion through admin route
      if (user._id === req.userId) {
        throw new ForbiddenError("Cannot delete your own account through admin route");
      }
      
      // Delete profile picture if exists
      if (user.profilePicture) {
        try {
          await deleteFromCloud(user.profilePicture);
        } catch (error) {
          console.error("Error deleting profile picture:", error);
        }
      }
      
      await User.findByIdAndDelete(req.params.id);
      
      res.status(200).json({
        success: true,
        message: "User deleted successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update user status (active/inactive)
   */
//   static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
//     try {
//       const { status } = req.body;
      
//       const user = await User.findById(req.params.id);
      
//       if (!user) {
//         throw new NotFoundError("User not found");
//       }
      
//       // Prevent self-status change through admin route
//       if (user._id === req.userId) {
//         throw new ForbiddenError("Cannot change your own status through admin route");
//       }
      
//       // Update user status
//       user.isActive = status;
//       await user.save();
      
//       res.status(200).json({
//         success: true,
//         message: `User ${status ? 'activated' : 'deactivated'} successfully`
//       });
//     } catch (error) {
//       next(error);
//     }
//   }
}

export default UserController;
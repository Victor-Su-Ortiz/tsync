import express from "express";
import { UserController } from "../controllers/user.controller";
import { protect, restrictTo } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validation.middleware";
import { userValidation } from "../validations/user.validation";
import { upload } from "../middleware/upload.middleware";
import { cache } from "../middleware/cache.middleware";

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Public user routes
router
  .route("/profile")
  .get(cache("5m"), UserController.getProfile)
  .patch(
    validateRequest(userValidation.updateProfile),
    UserController.updateProfile
  )
  .delete(UserController.deleteProfile);

router.patch(
  "/profile/picture",
  upload.single("profilePicture"),
  UserController.updateProfilePicture
);

router.patch(
  "/change-password",
  validateRequest(userValidation.changePassword),
  UserController.changePassword
);

// Admin routes - require admin role
router.use(restrictTo("admin"));

router
  .route("/")
  .get(cache("1m"), UserController.getAllUsers)
  .post(validateRequest(userValidation.createUser), UserController.createUser);

router
  .route("/:id")
  .get(cache("5m"), UserController.getUser)
  .patch(validateRequest(userValidation.updateUser), UserController.updateUser)
  .delete(UserController.deleteUser);

// router.patch(
//   "/:id/status",
//   validateRequest(userValidation.updateUserStatus),
//   UserController.updateUserStatus
// );

export default router;

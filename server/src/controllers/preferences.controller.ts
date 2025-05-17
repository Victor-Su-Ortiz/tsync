// // src/controllers/preferences.controller.ts

// import { Request, Response } from 'express';
// import User from '../models/user.model';
// import { AppError } from '../utils/errors';
// import { asyncHandler } from '../utils/asyncHandler';

// /**
//  * @desc    Get all preferences for current user
//  * @route   GET /api/users/preferences
//  * @access  Private
//  */
// export const getUserPreferences = asyncHandler(async (req: Request, res: Response) => {
//   console.log("req.user:", JSON.stringify(req.user, null, 2));

//   return
//   // const userId = req.user!._id;

//   // const user = await User.findById(userId);
//   // if (!user) {
//   //   throw new AppError('User not found', 404);
//   // }

//   // res.status(200).json({
//   //   success: true,
//   //   data: user.preferences || []
//   // });
// });

// /**
//  * @desc    Add a new preference
//  * @route   POST /api/users/preferences
//  * @access  Private
//  */
// export const addPreference = asyncHandler(async (req: Request, res: Response) => {
//   return
//   // const userId = req.user!.id;
//   // const { text } = req.body;

//   // if (!text) {
//   //   throw new AppError('Preference text is required', 400);
//   // }

//   // const user = await User.findById(userId);
//   // if (!user) {
//   //   throw new AppError('User not found', 404);
//   // }

//   // await user.addPreference(text);

//   // res.status(201).json({
//   //   success: true,
//   //   message: 'Preference added successfully',
//   //   data: user.preferences[user.preferences.length - 1]
//   // });
// });

// /**
//  * @desc    Update an existing preference
//  * @route   PUT /api/users/preferences/:id
//  * @access  Private
//  */
// export const updatePreference = asyncHandler(async (req: Request, res: Response) => {
//   return
//   // const userId = req.user!.id;
//   // const preferenceId = req.params.id;
//   // const { text } = req.body;

//   // if (!text) {
//   //   throw new AppError('New preference text is required', 400);
//   // }

//   // const user = await User.findById(userId);
//   // if (!user) {
//   //   throw new AppError('User not found', 404);
//   // }

//   // const preference = user.preferences.id(preferenceId);
//   // if (!preference) {
//   //   throw new AppError('Preference not found', 404);
//   // }

//   // await user.updatePreference(preferenceId, text);

//   // res.status(200).json({
//   //   success: true,
//   //   message: 'Preference updated successfully',
//   //   data: user.preferences.id(preferenceId)
//   // });
// });

// /**
//  * @desc    Delete a preference
//  * @route   DELETE /api/users/preferences/:id
//  * @access  Private
//  */
// export const deletePreference = asyncHandler(async (req: Request, res: Response) => {
//   return
//   // const userId = req.user!.id;
//   // const preferenceId = req.params.id;

//   // const user = await User.findById(userId);
//   // if (!user) {
//   //   throw new AppError('User not found', 404);
//   // }

//   // const preference = user.preferences.id(preferenceId);
//   // if (!preference) {
//   //   throw new AppError('Preference not found', 404);
//   // }

//   // await user.removePreference(preferenceId);

//   // res.status(200).json({
//   //   success: true,
//   //   message: 'Preference deleted successfully'
//   // });
// });

// /**
//  * @desc    Toggle preference active status
//  * @route   PATCH /api/users/preferences/:id/toggle
//  * @access  Private
//  */
// export const togglePreferenceStatus = asyncHandler(async (req: Request, res: Response) => {
//   return
//   // const userId = req.user!.id;
//   // const preferenceId = req.params.id;

//   // const user = await User.findById(userId);
//   // if (!user) {
//   //   throw new AppError('User not found', 404);
//   // }

//   // const preference = user.preferences.id(preferenceId);
//   // if (!preference) {
//   //   throw new AppError('Preference not found', 404);
//   // }

//   // await user.togglePreferenceStatus(preferenceId);

//   // res.status(200).json({
//   //   success: true,
//   //   message: `Preference ${preference.isActive ? 'deactivated' : 'activated'} successfully`,
//   //   data: user.preferences.id(preferenceId)
//   // });
// });
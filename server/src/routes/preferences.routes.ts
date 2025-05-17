// import express from 'express';
// import {
//   getUserPreferences,
//   addPreference,
//   updatePreference,
//   deletePreference,
//   togglePreferenceStatus
// } from '../controllers/preferences.controller';
// import { protect } from '../middleware/auth.middleware';

// const router = express.Router();

// // Protect all routes
// router.use(protect);

// // Routes for user preferences
// router.route('/')
//   .get(getUserPreferences)
//   .post(addPreference);

// router.route('/:id')
//   .put(updatePreference)
//   .delete(deletePreference);

// router.route('/:id/toggle')
//   .patch(togglePreferenceStatus);

// export default router;
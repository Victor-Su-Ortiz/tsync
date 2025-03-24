// src/routes/gemini.routes.ts
import express from 'express';
import { GeminiController } from '../controllers/gemini.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get AI-suggested meeting times
router.get('/events/:eventId/suggestions', GeminiController.getSuggestedTimes);

// Auto-schedule event using Gemini AI
router.post('/events/:eventId/auto-schedule', GeminiController.scheduleWithGemini);

export default router;

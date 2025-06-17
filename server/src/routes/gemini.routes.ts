// src/routes/gemini.routes.ts
import express from 'express';
import { GeminiController } from '../controllers/gemini.controller';
import { protect } from '../middleware/auth.middleware';
import { GeminiService } from '../services/gemini.service';
import { GoogleCalendarService } from '../services/google-calendar.service';

const router = express.Router();

const geminiService = new GeminiService(new GoogleCalendarService());

const geminiController = new GeminiController(geminiService);

// All routes require authentication
router.use(protect);

// Get AI-suggested meeting times
router.get('/events/:eventId/suggestions', geminiController.getSuggestedTimes);

// Auto-schedule event using Gemini AI
router.post('/events/:eventId/auto-schedule', geminiController.scheduleWithGemini);

export default router;

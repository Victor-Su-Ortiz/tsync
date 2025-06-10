import express from 'express';
import { FriendController } from '../controllers/friends.controller';
import { protect } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { friendValidation } from '../validations/friends.validation';
import { FriendService } from '../services/friends.service';

const router = express.Router();

const friendController = new FriendController(new FriendService());

// All routes are protected
router.use(protect);

// Get friend lists
router.get('/', friendController.getFriends);

// Get incoming friend requests
router.get('/requests/received', friendController.getReceivedRequests);

// Get pending friend requests
router.get('/requests/received/pending', friendController.getReceivedPendingRequests);

// Get outgoing friend requests
router.get('/requests/sent', friendController.getSentRequests);

router.get('/requests/sent/pending', friendController.getSentPendingRequests);

// Check if there exists a friend request between two users
router.get(
  '/requests/:userId',
  validateRequest(friendValidation.checkFriendRequest),
  friendController.checkFriendRequest
);

// Friend request operations
router.post(
  '/requests/:userId',
  validateRequest(friendValidation.sendRequest),
  friendController.sendRequest
);

router.put(
  '/requests/:requestId/accept',
  validateRequest(friendValidation.handleRequest),
  friendController.acceptRequest
);

router.put(
  '/requests/:requestId/reject',
  validateRequest(friendValidation.handleRequest),
  friendController.rejectRequest
);

router.delete(
  '/requests/:requestId',
  validateRequest(friendValidation.handleRequest),
  friendController.cancelRequest
);

// Friend removal
router.delete(
  '/:friendId',
  validateRequest(friendValidation.removeFriend),
  friendController.removeFriend
);

export default router;

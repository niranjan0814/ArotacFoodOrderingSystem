import express from 'express';
import { getConversation, sendMessage, markMessagesAsRead } from '../controllers/messageController.js';

const router = express.Router();

router.get('/conversation', getConversation);
router.post('/send', sendMessage);
router.post('/mark-read', markMessagesAsRead);

export default router;
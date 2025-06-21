const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// @route   POST /api/messages/schedule
router.post('/schedule', auth, messageController.scheduleMessage);

// @route   GET /api/messages/scheduled
router.get('/scheduled', auth, messageController.getScheduledMessages);

// @route   GET /api/messages/group/:groupId
router.get('/group/:groupId', auth, messageController.getMessagesByGroup);

module.exports = router;
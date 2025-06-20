const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   GET /api/user/profile
router.get('/profile', auth, userController.getProfile);

module.exports = router;
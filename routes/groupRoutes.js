const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

// @route   POST /api/groups
router.post('/', auth, groupController.saveGroup);

// @route   GET /api/groups
router.get('/', auth, groupController.getGroups);

module.exports = router;
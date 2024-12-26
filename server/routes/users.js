const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const { createOrUpdateUser } = require('../controllers/userController');

// Create or update user
router.post('/', authenticateUser, createOrUpdateUser);

module.exports = router;

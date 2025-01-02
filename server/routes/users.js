const express = require("express");
const router = express.Router();
const { createOrUpdateUser, getUser } = require("../controllers/userController");
const { authenticateUser } = require("../middleware/auth");

// Create or update user
router.post("/", authenticateUser, createOrUpdateUser);

// Get user by uid
router.get("/:uid", authenticateUser, getUser);

module.exports = router;

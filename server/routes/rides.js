const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/auth");
const { createRide } = require("../controllers/rideController");

// create ride
router.post("/", authenticateUser, createRide);

module.exports = router;

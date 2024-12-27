const express = require("express");
const router = express.Router();
const { createRide, findMatchingRides } = require("../controllers/rideController");
const { authenticateUser } = require("../middleware/auth");

// create ride
router.post("/create", authenticateUser, createRide);
router.get("/match/:rideId", authenticateUser, findMatchingRides);

module.exports = router;

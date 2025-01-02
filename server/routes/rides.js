const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/auth");
const { createRide, findMatches, getUserRides, getRide } = require("../controllers/rideController");
const { getWalkingDirections } = require("../controllers/directionsController");

// create ride
router.post("/", authenticateUser, createRide);

// find matches for a ride
router.get("/:rideId/matches", authenticateUser, findMatches);

// get user's rides
router.get("/user/rides", authenticateUser, getUserRides);

// get single ride
router.get("/:rideId", authenticateUser, getRide);

// get walking directions
router.get("/directions/walking", authenticateUser, getWalkingDirections);

module.exports = router;

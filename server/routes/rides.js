const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/auth");
const { createRide, findMatches } = require("../controllers/rideController");

// create ride
router.post("/", authenticateUser, createRide);

// find matches for a ride
router.get("/:rideId/matches", authenticateUser, findMatches);

module.exports = router;

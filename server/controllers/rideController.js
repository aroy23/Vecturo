const Ride = require("../models/Ride");

const createRide = async (req, res) => {
  try {
    const {
      pickup,
      pickupPlaceID,
      pickupZipCode,
      pickupLat,
      pickupLong,
      destination,
      destinationPlaceID,
      date,
      timeRangeStart,
      timeRangeEnd,
      passengers,
    } = req.body;

    if (!req.user || !req.user.uid) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const newRide = new Ride({
      userId: req.user.uid,
      pickup,
      pickupPlaceID,
      pickupZipCode,
      pickupLat,
      pickupLong,
      destination,
      destinationPlaceID,
      date,
      timeRangeStart,
      timeRangeEnd,
      passengers,
      isMatched: false,
    });

    const savedRide = await newRide.save();
    res.status(201).json(savedRide);
  } catch (error) {
    console.error("Error creating ride:", error);
    res
      .status(500)
      .json({ message: "Error creating ride", error: error.message });
  }
};

module.exports = { createRide };

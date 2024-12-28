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

    console.log("Creating ride with coordinates:", {
      pickupLat,
      pickupLong,
      pickup,
      date,
      timeRangeStart,
      timeRangeEnd
    });

    const newRide = new Ride({
      userId: req.user.uid,
      pickup,
      pickupPlaceID,
      pickupZipCode,
      pickupLocation: {
        type: 'Point',
        coordinates: [parseFloat(pickupLong), parseFloat(pickupLat)] // MongoDB expects [longitude, latitude]
      },
      destination,
      destinationPlaceID,
      date,
      timeRangeStart,
      timeRangeEnd,
      passengers,
      isMatched: false,
    });

    console.log("New ride object:", {
      userId: newRide.userId,
      pickupLocation: newRide.pickupLocation,
      date: newRide.date,
      timeRange: `${newRide.timeRangeStart}-${newRide.timeRangeEnd}`
    });

    const savedRide = await newRide.save();
    console.log("Ride saved successfully with ID:", savedRide._id);
    res.status(201).json(savedRide);
  } catch (error) {
    console.error("Error creating ride:", error);
    res
      .status(500)
      .json({ message: "Error creating ride", error: error.message });
  }
};

const findMatches = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    console.log("Finding matches for ride:", {
      rideId: ride._id,
      pickupLocation: ride.pickupLocation,
      date: ride.date,
      timeRange: `${ride.timeRangeStart}-${ride.timeRangeEnd}`
    });

    // Convert time strings to minutes for comparison
    const rideStart = convertTimeToMinutes(ride.timeRangeStart);
    const rideEnd = convertTimeToMinutes(ride.timeRangeEnd);

    // First, find all rides for debugging
    const allRides = await Ride.find({
      _id: { $ne: ride._id },
      userId: { $ne: ride.userId },
      isMatched: false,
      date: ride.date
    });

    console.log("Found potential rides before location filter:", allRides.length);
    console.log("Sample of potential rides:", allRides.slice(0, 2));

    // Find rides within 0.5 miles (approximately 804.672 meters)
    const matches = await Ride.find({
      _id: { $ne: ride._id }, // Exclude current ride
      userId: { $ne: ride.userId }, // Exclude rides from same user
      isMatched: false,
      date: ride.date,
      pickupLocation: {
        $near: {
          $geometry: ride.pickupLocation,
          $maxDistance: 804.672 // 0.5 miles in meters
        }
      }
    });

    console.log("Matches after location filter:", matches.length);

    // Filter matches by time window overlap
    const timeFilteredMatches = matches.filter(match => {
      const matchStart = convertTimeToMinutes(match.timeRangeStart);
      const matchEnd = convertTimeToMinutes(match.timeRangeEnd);

      const hasOverlap = (
        (matchStart >= rideStart && matchStart <= rideEnd) ||
        (matchEnd >= rideStart && matchEnd <= rideEnd) ||
        (matchStart <= rideStart && matchEnd >= rideEnd)
      );

      console.log("Time window comparison:", {
        match: `${match.timeRangeStart}-${match.timeRangeEnd}`,
        ride: `${ride.timeRangeStart}-${ride.timeRangeEnd}`,
        hasOverlap
      });

      return hasOverlap;
    });

    console.log("Final matches after time filter:", timeFilteredMatches.length);

    res.json(timeFilteredMatches);
  } catch (error) {
    console.error("Error finding matches:", error);
    res.status(500).json({ message: "Error finding matches", error: error.message });
  }
};

// Helper function to convert time string to minutes for comparison
function convertTimeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

module.exports = { createRide, findMatches };

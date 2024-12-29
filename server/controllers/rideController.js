const Ride = require("../models/Ride");
const mongoose = require("mongoose");

const createRide = async (req, res) => {
  try {
    console.log("Creating ride for user:", req.user.uid);
    console.log("Request body:", req.body);

    const {
      pickup,
      pickupAddress,
      pickupPlaceID,
      pickupLat,
      pickupLong,
      destination,
      destinationAddress,
      destinationPlaceID,
      date,
      timeRangeStart,
      timeRangeEnd,
      passengers,
    } = req.body;

    // Convert coordinates to numbers and validate
    const pickupLatNum = Number(pickupLat);
    const pickupLongNum = Number(pickupLong);

    if (isNaN(pickupLatNum) || isNaN(pickupLongNum)) {
      return res.status(400).json({ message: "Invalid coordinates provided" });
    }

    const newRide = new Ride({
      userId: req.user.uid,
      pickup,
      pickupAddress,
      pickupPlaceID,
      pickupLocation: {
        type: "Point",
        coordinates: [pickupLongNum, pickupLatNum],
      },
      destination,
      destinationAddress,
      destinationPlaceID,
      date,
      timeRangeStart,
      timeRangeEnd,
      passengers,
      isMatched: false,
      matchedRideId: null,
      matchRequestedAt: null,
    });

    const savedRide = await newRide.save();
    console.log("Ride saved successfully with ID:", savedRide._id);
    res.status(201).json(savedRide);
  } catch (error) {
    console.error("Error creating ride:", error);
    res.status(500).json({ message: "Error creating ride", error: error.message });
  }
};

const findMatches = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get the ride requesting matches
    const ride = await Ride.findOne({ 
      _id: req.params.rideId,
      isMatched: false // Only proceed if ride isn't already matched
    }).session(session);

    if (!ride) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ 
        message: ride ? "Ride is already matched" : "Ride not found" 
      });
    }

    // Update matchRequestedAt timestamp
    ride.matchRequestedAt = new Date();
    await ride.save({ session });

    console.log("Finding match for ride:", {
      rideId: ride._id,
      date: ride.date,
      timeRange: `${ride.timeRangeStart}-${ride.timeRangeEnd}`,
    });

    // Convert time strings to minutes for comparison
    const rideStart = convertTimeToMinutes(ride.timeRangeStart);
    const rideEnd = convertTimeToMinutes(ride.timeRangeEnd);

    // Efficient query using indexes
    const potentialMatch = await Ride.findOne({
      isMatched: false, // Use index to quickly filter out matched rides
      _id: { $ne: ride._id },
      userId: { $ne: ride.userId },
      date: ride.date,
      pickupLocation: {
        $near: {
          $geometry: ride.pickupLocation,
          $maxDistance: 804.672, // 0.5 miles in meters
        },
      },
    })
    .sort({ createdAt: 1 }) // Use compound index for efficient sorting
    .session(session);

    if (!potentialMatch) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json([]);
    }

    // Calculate time overlap
    const matchStart = convertTimeToMinutes(potentialMatch.timeRangeStart);
    const matchEnd = convertTimeToMinutes(potentialMatch.timeRangeEnd);

    const overlap = getTimeOverlap(
      rideStart,
      rideEnd,
      matchStart,
      matchEnd
    );

    if (!overlap) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json([]);
    }

    // Update both rides atomically
    ride.isMatched = true;
    ride.matchedRideId = potentialMatch._id;
    await ride.save({ session });

    potentialMatch.isMatched = true;
    potentialMatch.matchedRideId = ride._id;
    await potentialMatch.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return the match with overlap information
    res.status(200).json([{
      ...potentialMatch.toObject(),
      overlap
    }]);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error finding matches:", error);
    res.status(500).json({ message: "Error finding matches", error: error.message });
  }
};

const getUserRides = async (req, res) => {
  try {
    // Use compound index for efficient querying
    const rides = await Ride.find({ userId: req.user.uid })
      .sort({ createdAt: -1 })
      .populate('matchedRideId', 'userId pickup destination timeRangeStart timeRangeEnd');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rides", error: error.message });
  }
};

// Helper function to convert time string to minutes for comparison
function convertTimeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Helper function to calculate time overlap
function getTimeOverlap(start1, end1, start2, end2) {
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  if (overlapStart < overlapEnd) {
    return {
      start: `${Math.floor(overlapStart / 60)}:${String(overlapStart % 60).padStart(2, '0')}`,
      end: `${Math.floor(overlapEnd / 60)}:${String(overlapEnd % 60).padStart(2, '0')}`,
      duration: overlapEnd - overlapStart
    };
  }
  return null;
}

module.exports = { createRide, findMatches, getUserRides };

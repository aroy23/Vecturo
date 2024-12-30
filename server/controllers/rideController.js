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
      destinationLat,
      destinationLong,
      date,
      timeRangeStart,
      timeRangeEnd,
      passengers,
    } = req.body;

    // Convert coordinates to numbers and validate
    const pickupLatNum = Number(pickupLat);
    const pickupLongNum = Number(pickupLong);
    const destinationLatNum = Number(destinationLat);
    const destinationLongNum = Number(destinationLong);

    if (
      isNaN(pickupLatNum) || 
      isNaN(pickupLongNum) || 
      isNaN(destinationLatNum) || 
      isNaN(destinationLongNum)
    ) {
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
      destinationLocation: {
        type: "Point",
        coordinates: [destinationLongNum, destinationLatNum],
      },
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

    // First, find rides with matching pickup locations
    const nearbyPickups = await Ride.find({
      isMatched: false,
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
    .sort({ createdAt: 1 })
    .session(session);

    if (nearbyPickups.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json([]);
    }

    // Calculate distances to destination for each nearby pickup
    const potentialMatches = nearbyPickups.map(match => {
      const distance = calculateDistance(
        match.destinationLocation.coordinates[1],
        match.destinationLocation.coordinates[0],
        ride.destinationLocation.coordinates[1],
        ride.destinationLocation.coordinates[0]
      );
      return { match, distance };
    });

    // Filter matches within 0.2 miles of destination
    const destinationMatches = potentialMatches.filter(({ distance }) => distance <= 0.2);

    if (destinationMatches.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json([]);
    }

    // Get the oldest match that has time overlap
    let finalMatch = null;
    for (const { match } of destinationMatches) {
      const matchStart = convertTimeToMinutes(match.timeRangeStart);
      const matchEnd = convertTimeToMinutes(match.timeRangeEnd);

      const overlap = getTimeOverlap(
        rideStart,
        rideEnd,
        matchStart,
        matchEnd
      );

      if (overlap) {
        finalMatch = { match, overlap };
        break;
      }
    }

    if (!finalMatch) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json([]);
    }

    // Update both rides atomically
    ride.isMatched = true;
    ride.matchedRideId = finalMatch.match._id;
    await ride.save({ session });

    finalMatch.match.isMatched = true;
    finalMatch.match.matchedRideId = ride._id;
    await finalMatch.match.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return the match with overlap information
    res.status(200).json([{
      ...finalMatch.match.toObject(),
      overlap: finalMatch.overlap
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
    const rides = await Ride.find({ userId: req.user.uid })
      .sort({ createdAt: -1 })
      .populate('matchedRideId', 'userId pickup destination timeRangeStart timeRangeEnd');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rides", error: error.message });
  }
};

const getRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.rideId })
      .populate('matchedRideId', 'userId pickup pickupAddress destination destinationAddress timeRangeStart timeRangeEnd date passengers');
    
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Only allow users to view their own rides or rides they're matched with
    if (ride.userId !== req.user.uid && (!ride.matchedRideId || ride.matchedRideId.userId !== req.user.uid)) {
      return res.status(403).json({ message: "Not authorized to view this ride" });
    }

    res.json(ride);
  } catch (error) {
    console.error("Error fetching ride:", error);
    res.status(500).json({ message: "Error fetching ride", error: error.message });
  }
};

// Helper function to calculate distance between two points in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

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

module.exports = { createRide, findMatches, getUserRides, getRide };

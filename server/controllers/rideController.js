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
    res
      .status(500)
      .json({ message: "Error creating ride", error: error.message });
  }
};

const findMatches = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get the ride requesting matches
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      isMatched: false, // Only proceed if ride isn't already matched
    }).session(session);

    if (!ride) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: ride ? "Ride is already matched" : "Ride not found",
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

    // Find rides with matching pickup locations using basic geospatial query
    const nearbyPickups = await Ride.find({
      isMatched: false,
      _id: { $ne: ride._id },
      userId: { $ne: ride.userId },
      date: ride.date,
      pickupLocation: {
        $nearSphere: {
          $geometry: ride.pickupLocation,
          $maxDistance: 804.672 // 0.5 miles in meters
        }
      }
    })
    .sort({ createdAt: 1 })
    .session(session);

    console.log("Nearby pickups found:", nearbyPickups.length);

    if (nearbyPickups.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(200).json([]);
    }

    // Calculate distances to destination for each nearby pickup
    const potentialMatches = nearbyPickups.map((match) => {
      const distance = calculateDistance(
        match.destinationLocation.coordinates[1],
        match.destinationLocation.coordinates[0],
        ride.destinationLocation.coordinates[1],
        ride.destinationLocation.coordinates[0]
      );
      return { match, distance };
    });

    console.log("Potential matches with distances:", potentialMatches.map(m => ({
      id: m.match._id,
      distance: m.distance
    })));

    // Filter matches within 0.2 miles of destination
    const destinationMatches = potentialMatches.filter(
      ({ distance }) => distance <= 0.2
    );

    console.log("Matches within 0.2 miles of destination:", destinationMatches.length);

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
      const rideStart = convertTimeToMinutes(ride.timeRangeStart);
      const rideEnd = convertTimeToMinutes(ride.timeRangeEnd);

      console.log("Checking time overlap:", {
        ride: { start: ride.timeRangeStart, end: ride.timeRangeEnd },
        match: { start: match.timeRangeStart, end: match.timeRangeEnd }
      });

      const overlap = getTimeOverlap(rideStart, rideEnd, matchStart, matchEnd);
      console.log("Time overlap result:", overlap);

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

    // Calculate distances from both pickup points to determine starting point
    const ridePickupToMatchPickup = calculateDistance(
      ride.pickupLocation.coordinates[1],
      ride.pickupLocation.coordinates[0],
      finalMatch.match.pickupLocation.coordinates[1],
      finalMatch.match.pickupLocation.coordinates[0]
    );

    const matchPickupToRidePickup = calculateDistance(
      finalMatch.match.pickupLocation.coordinates[1],
      finalMatch.match.pickupLocation.coordinates[0],
      ride.pickupLocation.coordinates[1],
      ride.pickupLocation.coordinates[0]
    );

    // Determine which pickup point should be the starting point (shorter distance)
    const useRidePickupAsStart = ridePickupToMatchPickup <= matchPickupToRidePickup;

    const startingPoint = useRidePickupAsStart ? {
      name: ride.pickup,
      address: ride.pickupAddress,
      placeID: ride.pickupPlaceID,
      location: {
        type: 'Point',
        coordinates: ride.pickupLocation.coordinates
      }
    } : {
      name: finalMatch.match.pickup,
      address: finalMatch.match.pickupAddress,
      placeID: finalMatch.match.pickupPlaceID,
      location: {
        type: 'Point',
        coordinates: finalMatch.match.pickupLocation.coordinates
      }
    };

    // Calculate distances from starting point to both destinations
    const distanceToRideDestination = calculateDistance(
      startingPoint.location.coordinates[1],
      startingPoint.location.coordinates[0],
      ride.destinationLocation.coordinates[1],
      ride.destinationLocation.coordinates[0]
    );

    const distanceToMatchDestination = calculateDistance(
      startingPoint.location.coordinates[1],
      startingPoint.location.coordinates[0],
      finalMatch.match.destinationLocation.coordinates[1],
      finalMatch.match.destinationLocation.coordinates[0]
    );

    // Choose the closer destination as the ending point
    const useRideDestinationAsEnd = distanceToRideDestination <= distanceToMatchDestination;

    const endingPoint = useRideDestinationAsEnd ? {
      name: ride.destination,
      address: ride.destinationAddress,
      placeID: ride.destinationPlaceID,
      location: {
        type: 'Point',
        coordinates: ride.destinationLocation.coordinates
      }
    } : {
      name: finalMatch.match.destination,
      address: finalMatch.match.destinationAddress,
      placeID: finalMatch.match.destinationPlaceID,
      location: {
        type: 'Point',
        coordinates: finalMatch.match.destinationLocation.coordinates
      }
    };

    // Update both rides atomically with the starting point, ending point and match info
    ride.isMatched = true;
    ride.matchedRideId = finalMatch.match._id;
    ride.startingPoint = startingPoint.name;
    ride.startingPointAddress = startingPoint.address;
    ride.startingPointPlaceID = startingPoint.placeID;
    ride.startingPointLocation = startingPoint.location;
    ride.endingPoint = endingPoint.name;
    ride.endingPointAddress = endingPoint.address;
    ride.endingPointPlaceID = endingPoint.placeID;
    ride.endingPointLocation = endingPoint.location;
    await ride.save({ session });

    finalMatch.match.isMatched = true;
    finalMatch.match.matchedRideId = ride._id;
    finalMatch.match.startingPoint = startingPoint.name;
    finalMatch.match.startingPointAddress = startingPoint.address;
    finalMatch.match.startingPointPlaceID = startingPoint.placeID;
    finalMatch.match.startingPointLocation = startingPoint.location;
    finalMatch.match.endingPoint = endingPoint.name;
    finalMatch.match.endingPointAddress = endingPoint.address;
    finalMatch.match.endingPointPlaceID = endingPoint.placeID;
    finalMatch.match.endingPointLocation = endingPoint.location;
    await finalMatch.match.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return the match with overlap information
    res.status(200).json([
      {
        ...finalMatch.match.toObject(),
        overlap: finalMatch.overlap,
      },
    ]);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error finding matches:", error);
    res
      .status(500)
      .json({ message: "Error finding matches", error: error.message });
  }
};

const getUserRides = async (req, res) => {
  try {
    const rides = await Ride.find({ userId: req.user.uid })
      .sort({ createdAt: -1 })
      .populate(
        "matchedRideId",
        "userId pickup destination timeRangeStart timeRangeEnd"
      );
    res.json(rides);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching rides", error: error.message });
  }
};

const getRide = async (req, res) => {
  try {
    const { rideId } = req.params;  // Changed from id to rideId to match route parameter
    
    // Validate if rideId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(rideId)) {
      return res.status(400).json({ error: "Invalid ride ID format" });
    }

    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({ error: "Ride not found" });
    }

    res.status(200).json(ride);
  } catch (error) {
    console.error("Error fetching ride:", error);
    res.status(500).json({ error: "Failed to fetch ride details" });
  }
};

// Helper function to calculate distance between two points in miles
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3963; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
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

  if (overlapStart <= overlapEnd) {
    return {
      start: `${Math.floor(overlapStart / 60)}:${String(
        overlapStart % 60
      ).padStart(2, "0")}`,
      end: `${Math.floor(overlapEnd / 60)}:${String(overlapEnd % 60).padStart(
        2,
        "0"
      )}`,
      duration: overlapEnd - overlapStart,
    };
  }
  return null;
}

module.exports = { createRide, findMatches, getUserRides, getRide };

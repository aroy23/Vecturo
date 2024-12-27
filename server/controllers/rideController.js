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

const findMatchingRides = async (req, res) => {
  try {
    const { rideId } = req.params;

    // Get the ride details
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    // Find matching rides using geospatial query
    const matchingRides = await Ride.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(ride.pickupLong), parseFloat(ride.pickupLat)]
          },
          distanceField: "distance",
          maxDistance: 804.672, // 0.5 miles in meters
          spherical: true
        }
      },
      {
        $match: {
          _id: { $ne: ride._id }, // Exclude the current ride
          isMatched: false,
          userId: { $ne: ride.userId }, // Exclude rides from the same user
          date: ride.date,
          // Match rides where their time window overlaps with our time window
          $or: [
            // Case 1: Other ride's start time falls within our time window
            {
              timeRangeStart: { 
                $gte: ride.timeRangeStart,
                $lte: ride.timeRangeEnd 
              }
            },
            // Case 2: Other ride's end time falls within our time window
            {
              timeRangeEnd: { 
                $gte: ride.timeRangeStart,
                $lte: ride.timeRangeEnd 
              }
            },
            // Case 3: Other ride's time window completely encompasses our time window
            {
              $and: [
                { timeRangeStart: { $lte: ride.timeRangeStart } },
                { timeRangeEnd: { $gte: ride.timeRangeEnd } }
              ]
            }
          ]
        }
      },
      {
        $sort: { distance: 1 } // Sort by distance
      },
      {
        $limit: 5 // Limit to top 5 closest matches
      }
    ]);

    res.json({
      matches: matchingRides.map(match => ({
        ...match,
        distanceInMiles: (match.distance / 1609.34).toFixed(2) // Convert meters to miles
      }))
    });

  } catch (error) {
    console.error("Error finding matching rides:", error);
    res.status(500).json({ message: "Error finding matching rides", error: error.message });
  }
};

module.exports = { createRide, findMatchingRides };

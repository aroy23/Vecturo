const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  pickup: {
    type: String,
    required: true,
  },
  pickupPlaceID: {
    type: String,
    required: true,
  },
  pickupZipCode: {
    type: String,
    required: true,
  },
  pickupLocation: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  destination: {
    type: String,
    required: true,
  },
  destinationPlaceID: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  timeRangeStart: {
    type: String,
    required: true,
  },
  timeRangeEnd: {
    type: String,
    required: true,
  },
  passengers: {
    type: Number,
    required: true,
  },
  isMatched: {
    type: Boolean,
    default: false,
    required: true,
  },
});

// Create a 2dsphere index for geospatial queries
rideSchema.index({ pickupLocation: "2dsphere" });

module.exports = mongoose.model("Ride", rideSchema);

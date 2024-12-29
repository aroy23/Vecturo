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
  pickupAddress: {
    type: String,
    required: true,
  },
  pickupPlaceID: {
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
  destinationAddress: {
    type: String,
    required: true,
  },
  destinationPlaceID: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
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
    index: true  // Add single field index for quick filtering
  },
  matchedRideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    default: null
  },
  matchRequestedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Create index for location-based queries
rideSchema.index({ pickupLocation: "2dsphere" });

// Create compound indexes for efficient querying
rideSchema.index({ isMatched: 1, date: 1 }); // For filtering unmatched rides by date
rideSchema.index({ isMatched: 1, createdAt: 1 }); // For sorting by creation time
rideSchema.index({ userId: 1, isMatched: 1 }); // For finding user's rides

module.exports = mongoose.model("Ride", rideSchema);

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
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  pickupLat: {
    type: String,
    required: true,
  },
  pickupLong: {
    type: String,
    required: true,
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
    default: false
  },
  matchedRideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    default: null
  }
});

// Create geospatial index for pickup location
rideSchema.index({ pickupLocation: '2dsphere' });

// Pre-save middleware to set pickupLocation from lat/long
rideSchema.pre('save', function(next) {
  if (this.pickupLat && this.pickupLong) {
    this.pickupLocation = {
      type: 'Point',
      coordinates: [parseFloat(this.pickupLong), parseFloat(this.pickupLat)]
    };
  }
  next();
});

const Ride = mongoose.model("Ride", rideSchema);

module.exports = Ride;

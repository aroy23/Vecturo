const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
}, { _id: false });

const optionalPointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: false
  },
  coordinates: {
    type: [Number],
    required: false
  }
}, { _id: false });

const rideSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  bookerUid: {
    type: String,
    default: null,
  },
  userPhone: {
    type: String,
    required: true,
  },
  matchedUserPhone: {
    type: String,
    default: null,
  },
  passengers: {
    type: Number,
    required: true,
    min: 1
  },
  totalPassengers: {
    type: Number,
    default: null,
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
  pickupLocation: pointSchema,
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
  destinationLocation: pointSchema,
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
  isMatched: {
    type: Boolean,
    default: false,
  },
  matchedRideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    default: null
  },
  matchRequestedAt: {
    type: Date,
    default: null
  },
  startingPoint: {
    type: String,
    default: null
  },
  startingPointAddress: {
    type: String,
    default: null
  },
  startingPointPlaceID: {
    type: String,
    default: null
  },
  startingPointLocation: optionalPointSchema,
  endingPoint: {
    type: String,
    default: null
  },
  endingPointAddress: {
    type: String,
    default: null
  },
  endingPointPlaceID: {
    type: String,
    default: null
  },
  endingPointLocation: optionalPointSchema
}, {
  timestamps: true
});

// Create simple 2dsphere index for pickupLocation
rideSchema.index({ pickupLocation: '2dsphere' });

const Ride = mongoose.model("Ride", rideSchema);

module.exports = Ride;

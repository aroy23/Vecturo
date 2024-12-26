const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  pickup: {
    type: String,
    required: true,
  },
  destination: {
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
  }
});

module.exports = mongoose.model("Ride", rideSchema);

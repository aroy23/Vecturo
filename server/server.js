const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/users");
const rideRoutes = require("./routes/rides");
const { AodOutlined } = require("@mui/icons-material");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");

    // Ensure geospatial index exists
    try {
      const Ride = require("./models/Ride");
      await Ride.collection.createIndex({ pickupLocation: "2dsphere" });
      console.log("Geospatial index Verified");
    } catch (error) {
      console.error("Error creating geospatial index:", error);
    }
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/rides", rideRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

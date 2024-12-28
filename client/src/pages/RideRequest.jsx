import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiClock, FiUsers } from "react-icons/fi";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/ui/Button";
import LocationAutocomplete from "../components/LocationAutocomplete";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const RideRequest = () => {
  const [formData, setFormData] = useState({
    pickup: "",
    pickupPlaceID: "",
    pickupZipCode: "",
    pickupLat: "",
    pickupLong: "",
    destination: "",
    destinationPlaceID: "",
    date: "",
    timeRangeStart: "",
    timeRangeEnd: "",
    passengers: 1,
  });
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLocationSelect = (location, type) => {
    setFormData((prev) => ({
      ...prev,
      [type]: location.description,
      [`${type}PlaceID`]: location.place_id,
      ...(type === 'pickup' && {
        pickupZipCode: location.zipCode,
        pickupLat: location.lat.toString(),
        pickupLong: location.lng.toString(),
      })
    }));
  };

  const handleLocationChange = (value, type) => {
    setFormData((prev) => ({
      ...prev,
      [type]: value,
      [`${type}PlaceID`]: "", // Clear placeID when input changes
      ...(type === 'pickup' && {
        pickupZipCode: '',
        pickupLat: '',
        pickupLong: '',
      })
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const findMatches = async (rideId) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Please log in to find matches");

      console.log("Finding matches for ride:", rideId);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rides/${rideId}/matches`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to find matches");
      }

      const matchData = await response.json();
      console.log("Found matches:", matchData);
      setMatches(matchData);
      
      if (matchData.length === 0) {
        setError("No matches found nearby. We'll keep looking!");
      }
    } catch (error) {
      console.error("Error finding matches:", error);
      setError(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMatches([]); // Clear previous matches
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Please log in to create a ride");
      }

      console.log("Creating ride with data:", formData);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rides`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      let errorMessage = "Failed to create ride";
      if (!response.ok) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Ride created successfully:", data);
      
      // Find matches for the newly created ride
      await findMatches(data._id);
    } catch (error) {
      console.error("Error creating ride:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <section className="relative min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="container-padding py-20"
        >
          <motion.h1
            variants={fadeIn}
            className="text-center text-4xl font-bold mb-6 gradient-text"
          >
            Request a Ride
          </motion.h1>
          <motion.p
            variants={fadeIn}
            className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
          >
            Fill out the details below to find your perfect rideshare match.
          </motion.p>

          {error && (
            <motion.div
              variants={fadeIn}
              className="mb-6 p-4 text-red-700 bg-red-100 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <motion.form
            variants={staggerContainer}
            onSubmit={handleSubmit}
            className="bg-white shadow-xl rounded-2xl p-8 max-w-3xl mx-auto space-y-6"
          >
            <motion.div variants={fadeIn} className="form-group">
              <LocationAutocomplete
                label="Pickup Location"
                value={formData.pickup}
                onChange={(value) => handleLocationChange(value, "pickup")}
                onSelect={(location) => handleLocationSelect(location, "pickup")}
              />
            </motion.div>

            <motion.div variants={fadeIn} className="form-group">
              <LocationAutocomplete
                label="Destination"
                value={formData.destination}
                onChange={(value) => handleLocationChange(value, "destination")}
                onSelect={(location) =>
                  handleLocationSelect(location, "destination")
                }
              />
            </motion.div>

            <motion.div variants={fadeIn} className="form-group">
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700"
              >
                Date
              </label>
              <div className="relative mt-1">
                <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input pl-10"
                  required
                />
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="form-group">
              <label
                htmlFor="timeRange"
                className="block text-sm font-medium text-gray-700"
              >
                Start Time Range
              </label>
              <div className="relative mt-1 flex items-center gap-3">
                <div className="relative flex-1">
                  <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    id="timeRangeStart"
                    name="timeRangeStart"
                    value={formData.timeRangeStart}
                    onChange={handleChange}
                    className="input pl-10 w-full"
                    required
                  />
                </div>
                <span className="text-gray-500">to</span>
                <div className="relative flex-1">
                  <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    id="timeRangeEnd"
                    name="timeRangeEnd"
                    value={formData.timeRangeEnd}
                    onChange={handleChange}
                    className="input pl-10 w-full"
                    required
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="form-group">
              <label
                htmlFor="passengers"
                className="block text-sm font-medium text-gray-700"
              >
                Passengers
              </label>
              <div className="relative mt-1">
                <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  id="passengers"
                  name="passengers"
                  value={formData.passengers}
                  onChange={handleChange}
                  className="input pl-10"
                  required
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>

            <motion.div variants={fadeIn} className="text-center">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Finding Matches..." : "Find Rideshare"}
              </Button>
            </motion.div>
          </motion.form>

          {loading && (
            <motion.div
              variants={fadeIn}
              className="mt-8 text-center text-gray-600"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              Finding potential matches...
            </motion.div>
          )}

          {error && (
            <motion.div
              variants={fadeIn}
              className="mt-8 p-4 bg-red-50 border border-red-100 rounded-lg max-w-3xl mx-auto"
            >
              <p className="text-red-700 text-center">{error}</p>
            </motion.div>
          )}

          {!loading && matches.length > 0 && (
            <motion.div
              variants={fadeIn}
              className="mt-8 max-w-3xl mx-auto"
            >
              <h2 className="text-2xl font-bold mb-4 text-center">Potential Matches</h2>
              <div className="space-y-4">
                {matches.map((match) => (
                  <div
                    key={match._id}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">Pickup: {match.pickup}</h3>
                        <p className="text-gray-600">Destination: {match.destination}</p>
                        <p className="text-gray-600">
                          Time: {match.timeRangeStart} - {match.timeRangeEnd}
                        </p>
                        <p className="text-gray-600">
                          Passengers: {match.passengers}
                        </p>
                        <p className="text-gray-600">
                          Date: {match.date}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          // TODO: Implement match confirmation
                          console.log("Match selected:", match._id);
                        }}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Select Match
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>
    </MainLayout>
  );
};

export default RideRequest;

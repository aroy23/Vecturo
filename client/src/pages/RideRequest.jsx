import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiClock, FiUsers } from "react-icons/fi";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/ui/Button";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { useNavigate } from "react-router-dom";
import { to24Hour } from "../utils/timeUtils";

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
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickup: "",
    pickupDisplay: "",
    pickupAddress: "",
    pickupPlaceID: "",
    pickupLat: "",
    pickupLong: "",
    destination: "",
    destinationDisplay: "",
    destinationAddress: "",
    destinationPlaceID: "",
    destinationLat: "",
    destinationLong: "",
    date: "",
    timeRangeStart: "",
    timeRangeEnd: "",
    passengers: 1,
  });
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeError, setTimeError] = useState(null);

  const handleLocationSelect = (location, type) => {
    console.log('Location selected:', location);
    setFormData((prev) => {
      const newData = {
        ...prev,
        [type]: location.displayText,
        [`${type}Display`]: location.displayText,
        [`${type}Address`]: location.description,
        [`${type}PlaceID`]: location.place_id,
        ...(type === 'pickup' && {
          pickupLat: location.lat,
          pickupLong: location.lng,
        }),
        ...(type === 'destination' && {
          destinationLat: location.lat,
          destinationLong: location.lng,
        })
      };
      console.log(`Updated form data for ${type}:`, newData);
      return newData;
    });
  };

  const handleLocationChange = (value, type) => {
    setFormData((prev) => ({
      ...prev,
      [type]: value,
      [`${type}Display`]: value,
      [`${type}Address`]: value,
      [`${type}PlaceID`]: "",
      ...(type === 'pickup' && {
        pickupLat: '',
        pickupLong: '',
      }),
      ...(type === 'destination' && {
        destinationLat: '',
        destinationLong: '',
      })
    }));
  };

  const validateTimeWindow = (start, end) => {
    if (!start || !end) return true;

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    
    // Convert to minutes for easier comparison
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Check if end time is before start time
    if (endMinutes <= startMinutes) {
      setTimeError("End time must be after start time");
      return false;
    }

    // Check if time window is within the same day (24 hours)
    if (endMinutes - startMinutes > 24 * 60) {
      setTimeError("Time window cannot exceed 24 hours");
      return false;
    }

    setTimeError(null);
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'date') {
      // Store the date as is, without timezone adjustment
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (name === 'timeRangeStart' || name === 'timeRangeEnd') {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        validateTimeWindow(
          name === 'timeRangeStart' ? value : prev.timeRangeStart,
          name === 'timeRangeEnd' ? value : prev.timeRangeEnd
        );
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate time window before submission
    if (!validateTimeWindow(formData.timeRangeStart, formData.timeRangeEnd)) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Please log in to create a ride");

      if (!formData.pickupLat || !formData.pickupLong || !formData.pickupPlaceID || !formData.destinationPlaceID) {
        throw new Error("Please select valid pickup and destination locations from the dropdown");
      }

      const pickupLat = parseFloat(formData.pickupLat);
      const pickupLong = parseFloat(formData.pickupLong);

      if (isNaN(pickupLat) || isNaN(pickupLong)) {
        throw new Error("Invalid coordinates. Please select the location again.");
      }

      const requestData = {
        pickup: formData.pickupDisplay || formData.pickup,
        pickupAddress: formData.pickupAddress,
        destination: formData.destinationDisplay || formData.destination,
        destinationAddress: formData.destinationAddress,
        pickupPlaceID: formData.pickupPlaceID,
        pickupLat: formData.pickupLat,
        pickupLong: formData.pickupLong,
        destinationPlaceID: formData.destinationPlaceID,
        destinationLat: formData.destinationLat,
        destinationLong: formData.destinationLong,
        date: formData.date,
        timeRangeStart: formData.timeRangeStart,
        timeRangeEnd: formData.timeRangeEnd,
        passengers: parseInt(formData.passengers),
      };

      console.log('Submitting ride request with data:', requestData);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create ride");
      }

      const newRide = await response.json();
      
      localStorage.setItem("lastCreatedRideId", newRide._id);
      
      navigate("/my-rides");
      
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
                value={formData.pickupDisplay || formData.pickup}
                onChange={(value) => handleLocationChange(value, "pickup")}
                onSelect={(location) => handleLocationSelect(location, "pickup")}
              />
            </motion.div>

            <motion.div variants={fadeIn} className="form-group">
              <LocationAutocomplete
                label="Destination"
                value={formData.destinationDisplay || formData.destination}
                onChange={(value) => handleLocationChange(value, "destination")}
                onSelect={(location) => handleLocationSelect(location, "destination")}
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
                  min={new Date().toISOString().split('T')[0]}
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
                Time Window
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
              {timeError && (
                <p className="mt-2 text-sm text-red-600">{timeError}</p>
              )}
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
              <Button
                type="submit"
                disabled={loading || timeError || !formData.timeRangeStart || !formData.timeRangeEnd}
                className={`w-full md:w-auto ${
                  (loading || timeError || !formData.timeRangeStart || !formData.timeRangeEnd)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Ride'
                )}
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

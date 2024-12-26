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
    destination: "",
    date: "",
    timeRangeStart: "",
    timeRangeEnd: "",
    passengers: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Please log in to create a ride");
      }

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
      console.log("Ride created successfully:");
    } catch (error) {
      console.error("Error creating ride:", error);
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

          <motion.form
            variants={staggerContainer}
            onSubmit={handleSubmit}
            className="bg-white shadow-xl rounded-2xl p-8 max-w-3xl mx-auto space-y-6"
          >
            <motion.div variants={fadeIn} className="form-group">
              <LocationAutocomplete
                id="pickup"
                label="Pickup Location"
                placeholder="Enter pickup location"
                value={formData.pickup}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, pickup: value }))
                }
              />
            </motion.div>

            <motion.div variants={fadeIn} className="form-group">
              <LocationAutocomplete
                id="destination"
                label="Destination"
                placeholder="Enter destination"
                value={formData.destination}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, destination: value }))
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
              <Button type="submit" className="w-full">
                Find Rideshare
              </Button>
            </motion.div>
          </motion.form>
        </motion.div>
      </section>
    </MainLayout>
  );
};

export default RideRequest;

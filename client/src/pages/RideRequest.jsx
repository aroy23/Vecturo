import React, { useState, Fragment, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiClock,
  FiUsers,
  FiChevronDown,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";
import { Listbox, Transition, RadioGroup } from "@headlessui/react";
import MainLayout from "../layouts/MainLayout";
import LocationAutocomplete from "../components/LocationAutocomplete";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/RideRequest.css";

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

const generateTimeOptions = () => {
  const options = [];
  const currentDate = new Date();

  // Calculate the next available time (30 min buffer)
  const minutes = currentDate.getMinutes();
  let startHour = currentDate.getHours();
  let startMinute = minutes;

  // Add 30 minutes buffer
  startMinute += 30;

  // Adjust hour if minutes roll over
  if (startMinute >= 60) {
    startHour += Math.floor(startMinute / 60);
    startMinute = startMinute % 60;
  }

  // Round up to next 15-minute interval
  startMinute = Math.ceil(startMinute / 15) * 15;

  // Adjust hour again if rounding caused minutes to roll over
  if (startMinute >= 60) {
    startHour += Math.floor(startMinute / 60);
    startMinute = startMinute % 60;
  }

  // Adjust for 24-hour rollover
  startHour = startHour % 24;

  // Generate times starting from the computed start time
  let currentHour = startHour;

  while (currentHour <= 23) {
    // Only generate times until 11:45 PM
    for (let minute = 0; minute < 60; minute += 15) {
      // Skip times before the start time on the first hour
      if (currentHour === startHour && minute < startMinute) continue;

      // Stop at 11:45 PM
      if (currentHour === 23 && minute > 45) break;

      const timeValue = `${currentHour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const displayHour = currentHour % 12 || 12;
      const ampm = currentHour < 12 ? "AM" : "PM";
      const displayTime = `${displayHour}:${minute
        .toString()
        .padStart(2, "0")} ${ampm}`;

      options.push({ value: timeValue, display: displayTime });
    }
    currentHour++;
  }

  return options;
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
  const [distanceError, setDistanceError] = useState(null);
  const [isValidDistance, setIsValidDistance] = useState(false);
  const [timeOptions, setTimeOptions] = useState(generateTimeOptions());

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };

  const validateDistance = () => {
    if (formData.pickupLat && formData.pickupLong && formData.destinationLat && formData.destinationLong) {
      const distance = calculateDistance(
        parseFloat(formData.pickupLat),
        parseFloat(formData.pickupLong),
        parseFloat(formData.destinationLat),
        parseFloat(formData.destinationLong)
      );
      
      if (distance < 0.5) {
        setDistanceError("Pickup and destination must be at least 0.5 miles apart");
        setIsValidDistance(false);
        return;
      }
      setDistanceError(null);
      setIsValidDistance(true);
    } else {
      setIsValidDistance(false);
      setDistanceError(null);
    }
  };

  useEffect(() => {
    validateDistance();
  }, [formData.pickupLat, formData.pickupLong, formData.destinationLat, formData.destinationLong]);

  useEffect(() => {
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const currentDate = new Date();
      
      // If selected date is today, filter times based on current time
      if (selectedDate.toDateString() === currentDate.toDateString()) {
        setTimeOptions(generateTimeOptions());
      } else {
        // For future dates, show all time slots
        const allOptions = [];
        for (let hour = 0; hour <= 23; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            // Stop at 11:45 PM
            if (hour === 23 && minute > 45) break;

            const timeValue = `${hour.toString().padStart(2, "0")}:${minute
              .toString()
              .padStart(2, "0")}`;
            const displayHour = hour % 12 || 12;
            const ampm = hour < 12 ? "AM" : "PM";
            const displayTime = `${displayHour}:${minute
              .toString()
              .padStart(2, "0")} ${ampm}`;

            allOptions.push({ value: timeValue, display: displayTime });
          }
        }
        setTimeOptions(allOptions);
      }

      // Clear selected times if they're no longer valid
      const currentTime = new Date();
      if (selectedDate.toDateString() === currentDate.toDateString()) {
        const selectedStartTime = formData.timeRangeStart;
        if (selectedStartTime) {
          const [hours, minutes] = selectedStartTime.split(':').map(Number);
          const selectedDateTime = new Date(selectedDate);
          selectedDateTime.setHours(hours, minutes);
          
          if (selectedDateTime < currentTime) {
            setFormData(prev => ({
              ...prev,
              timeRangeStart: '',
              timeRangeEnd: ''
            }));
          }
        }
      }
    }
  }, [formData.date]);

  const isFormValid = () => {
    return (
      formData.pickupPlaceID &&
      formData.destinationPlaceID &&
      formData.date &&
      formData.timeRangeStart &&
      formData.timeRangeEnd &&
      !timeError &&
      isValidDistance
    );
  };

  const handleLocationSelect = (location, type) => {
    console.log("Location selected:", location);
    setFormData((prev) => {
      const newData = {
        ...prev,
        [type]: location.displayText,
        [`${type}Display`]: location.displayText,
        [`${type}Address`]: location.description,
        [`${type}PlaceID`]: location.place_id,
        ...(type === "pickup" && {
          pickupLat: location.lat,
          pickupLong: location.lng,
        }),
        ...(type === "destination" && {
          destinationLat: location.lat,
          destinationLong: location.lng,
        }),
      };
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
      ...(type === "pickup" && {
        pickupLat: "",
        pickupLong: "",
      }),
      ...(type === "destination" && {
        destinationLat: "",
        destinationLong: "",
      }),
    }));
  };

  const validateTimeWindow = (start, end) => {
    if (!start || !end) return true;

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    // Convert to minutes for easier comparison
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    // Check if end time is before start time
    if (endMinutes < startMinutes) {
      setTimeError("End time must not be before start time");
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

    if (name === "date") {
      const selectedDate = new Date(value);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      if (selectedDate < currentDate) {
        // Don't allow past dates
        return;
      }
      
      // Store the date as is, without timezone adjustment
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (name === "timeRangeStart" || name === "timeRangeEnd") {
      setFormData((prev) => {
        const newData = { ...prev, [name]: value };
        validateTimeWindow(
          name === "timeRangeStart" ? value : prev.timeRangeStart,
          name === "timeRangeEnd" ? value : prev.timeRangeEnd
        );
        return newData;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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

      if (
        !formData.pickupLat ||
        !formData.pickupLong ||
        !formData.pickupPlaceID ||
        !formData.destinationPlaceID
      ) {
        throw new Error(
          "Please select valid pickup and destination locations from the dropdown"
        );
      }

      const pickupLat = parseFloat(formData.pickupLat);
      const pickupLong = parseFloat(formData.pickupLong);

      if (isNaN(pickupLat) || isNaN(pickupLong)) {
        throw new Error(
          "Invalid coordinates. Please select the location again."
        );
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
        passengers: formData.passengers,
      };

      // Create the ride
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create ride");
      }

      const newRide = await response.json();

      // Find matches for the new ride
      const matchesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/rides/${newRide._id}/matches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!matchesResponse.ok) {
        throw new Error("Failed to find matches");
      }

      const matches = await matchesResponse.json();

      // Always navigate to my-rides page
      navigate("/my-rides");
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="container mx-auto px-4 py-12 max-w-4xl"
        >
          <motion.div variants={fadeIn} className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              Request a Ride
            </h1>
            <p className="text-gray-600">
              Fill in your journey details and find your perfect rideshare match
            </p>
          </motion.div>

          {error && (
            <motion.div
              variants={fadeIn}
              className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {distanceError && (
            <motion.div
              variants={fadeIn}
              className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{distanceError}</p>
                </div>
              </div>
            </motion.div>
          )}
          <motion.form
            variants={staggerContainer}
            onSubmit={handleSubmit}
            className="space-y-6 bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="grid gap-6 md:grid-cols-2">
              {/* Location Inputs */}
              <motion.div variants={fadeIn} className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Location
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <LocationAutocomplete
                      label=""
                      value={formData.pickupDisplay || formData.pickup}
                      onChange={(value) =>
                        handleLocationChange(value, "pickup")
                      }
                      onSelect={(location) =>
                        handleLocationSelect(location, "pickup")
                      }
                      className="pl-10 w-full py-2.5 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <LocationAutocomplete
                      label=""
                      value={
                        formData.destinationDisplay || formData.destination
                      }
                      onChange={(value) =>
                        handleLocationChange(value, "destination")
                      }
                      onSelect={(location) =>
                        handleLocationSelect(location, "destination")
                      }
                      className="pl-10 w-full py-2.5 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Date and Time Inputs */}
              <motion.div variants={fadeIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Journey Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <FiCalendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <DatePicker
                      selected={formData.date}
                      onChange={(date) =>
                        handleChange({ target: { name: "date", value: date } })
                      }
                      dateFormat="MM/dd/yyyy"
                      minDate={new Date()}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      placeholderText="Select Date"
                      popperClassName="z-50"
                      calendarClassName="shadow-lg border-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Window
                  </label>
                  <div className="flex items-center space-x-3">
                    <Listbox
                      value={formData.timeRangeStart}
                      onChange={(time) =>
                        handleChange({
                          target: { name: "timeRangeStart", value: time },
                        })
                      }
                    >
                      <div className="relative flex-1">
                        <Listbox.Button className="relative w-full py-2.5 pl-10 pr-10 bg-gray-50 border-0 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiClock className="h-5 w-5 text-blue-500" />
                          </div>
                          <span className="block truncate">
                            {formData.timeRangeStart
                              ? timeOptions.find(
                                  (t) => t.value === formData.timeRangeStart
                                )?.display || "Start Time"
                              : "Start Time"}
                          </span>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <FiChevronDown className="h-5 w-5 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {timeOptions.map((time) => (
                              <Listbox.Option
                                key={time.value}
                                value={time.value}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active
                                      ? "bg-blue-50 text-blue-600"
                                      : "text-gray-900"
                                  }`
                                }
                              >
                                {time.display}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>

                    <div className="flex-shrink-0">
                      <div className="w-6 h-[2px] bg-gray-300"></div>
                    </div>

                    <Listbox
                      value={formData.timeRangeEnd}
                      onChange={(time) =>
                        handleChange({
                          target: { name: "timeRangeEnd", value: time },
                        })
                      }
                    >
                      <div className="relative flex-1">
                        <Listbox.Button className="relative w-full py-2.5 pl-10 pr-10 bg-gray-50 border-0 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiClock className="h-5 w-5 text-blue-500" />
                          </div>
                          <span className="block truncate">
                            {formData.timeRangeEnd
                              ? timeOptions.find(
                                  (t) => t.value === formData.timeRangeEnd
                                )?.display || "End Time"
                              : "End Time"}
                          </span>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <FiChevronDown className="h-5 w-5 text-gray-400" />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {timeOptions.map((time) => (
                              <Listbox.Option
                                key={time.value}
                                value={time.value}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                    active
                                      ? "bg-blue-50 text-blue-600"
                                      : "text-gray-900"
                                  }`
                                }
                              >
                                {time.display}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>
                  {timeError && (
                    <p className="mt-2 text-sm text-red-600">{timeError}</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Passengers Selection */}
            <motion.div variants={fadeIn} className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Number of Passengers
              </label>
              <RadioGroup
                value={formData.passengers}
                onChange={(value) =>
                  handleChange({ target: { name: "passengers", value } })
                }
                className="grid grid-cols-3 gap-3"
              >
                {[1, 2, 3].map((number) => (
                  <RadioGroup.Option
                    key={number}
                    value={number}
                    className={({ active, checked }) =>
                      `${active ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${
                        checked
                          ? "bg-blue-500 text-white"
                          : "bg-gray-50 hover:bg-blue-50"
                      } relative flex cursor-pointer items-center justify-center rounded-lg px-3 py-2 transition-all duration-200`
                    }
                  >
                    {({ checked }) => (
                      <div className="flex items-center justify-center gap-2">
                        <FiUsers
                          className={`h-5 w-5 ${
                            checked ? "text-white" : "text-blue-500"
                          }`}
                        />
                        <RadioGroup.Label
                          as="span"
                          className={`font-medium ${
                            checked ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {number}
                        </RadioGroup.Label>
                      </div>
                    )}
                  </RadioGroup.Option>
                ))}
              </RadioGroup>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className={`w-full px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                isFormValid() && !loading
                  ? "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
              whileHover={{ scale: isFormValid() && !loading ? 1.02 : 1 }}
              whileTap={{ scale: isFormValid() && !loading ? 0.98 : 1 }}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Finding Matches...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Find Matches
                </>
              )}
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default RideRequest;

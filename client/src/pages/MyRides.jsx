import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/ui/Button";
import { to12Hour, formatDate, getTimeOverlap } from "../utils/timeUtils";

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

const LocationWithTooltip = ({ label, name, address }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex items-center text-gray-600 relative group">
      <FiMapPin className="mr-2" />
      <span
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        {label}: {name}
      </span>
      {showTooltip && (
        <div className="absolute left-0 top-full mt-2 bg-gray-800 text-white text-sm rounded-md px-3 py-2 z-50 w-64 shadow-lg">
          <div className="font-medium mb-1">{name}</div>
          <div className="text-gray-300 text-xs">{address}</div>
        </div>
      )}
    </div>
  );
};

const isRideExpired = (ride) => {
  try {
    // Parse the date and time properly considering timezone
    const [year, month, day] = ride.date.split("T")[0].split("-").map(Number);
    const [hours, minutes] = ride.timeRangeStart.split(":").map(Number);

    const rideStartTime = new Date(year, month - 1, day, hours, minutes);
    const currentTime = new Date();

    // If there's a matched ride with valid data, use the later of the two start times
    if (
      ride.matchedRideId &&
      ride.matchedRideId.date &&
      ride.matchedRideId.timeRangeStart
    ) {
      const [matchedYear, matchedMonth, matchedDay] = ride.matchedRideId.date
        .split("T")[0]
        .split("-")
        .map(Number);
      const [matchedHours, matchedMinutes] = ride.matchedRideId.timeRangeStart
        .split(":")
        .map(Number);
      const matchedStartTime = new Date(
        matchedYear,
        matchedMonth - 1,
        matchedDay,
        matchedHours,
        matchedMinutes
      );

      // Use the later start time between the two rides
      const effectiveStartTime = new Date(
        Math.max(rideStartTime.getTime(), matchedStartTime.getTime())
      );
      console.log("Effective start time:", effectiveStartTime);
      console.log("Current time:", currentTime);
      console.log("Is expired:", effectiveStartTime < currentTime);

      return effectiveStartTime < currentTime;
    }

    console.log("Ride start time:", rideStartTime);
    console.log("Current time:", currentTime);
    console.log("Is expired:", rideStartTime < currentTime);

    return rideStartTime < currentTime;
  } catch (error) {
    console.error("Error checking if ride is expired:", error);
    return false; // Default to not expired if there's an error
  }
};

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Please log in to view rides");

      console.log("Fetching rides with token:", token);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/rides/user/rides`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch rides");
      }

      const data = await response.json();
      console.log("Initial rides data:", data);
      setRides(data);
    } catch (error) {
      console.error(
        "Error fetching rides try signing out and signing in:",
        error
      );
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    );
  }

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
            My Rides
          </motion.h1>
          <motion.p
            variants={fadeIn}
            className="text-center text-gray-600 mb-12 max-w-2xl mx-auto"
          >
            View Your Ride Requests and Ride Matches
          </motion.p>

          {error && (
            <motion.div
              variants={fadeIn}
              className="mb-6 p-4 text-red-700 bg-red-100 rounded-lg max-w-3xl mx-auto"
            >
              {error}
            </motion.div>
          )}

          {rides.length === 0 ? (
            <motion.div variants={fadeIn} className="text-center text-gray-600">
              You haven't created any rides yet.
            </motion.div>
          ) : (
            <motion.div
              variants={fadeIn}
              className="space-y-6 max-w-3xl mx-auto"
            >
              {rides.map((ride) => (
                <div
                  key={ride._id}
                  className={`bg-white p-6 rounded-lg shadow-md transition-all ring-2 ${
                    ride.isMatched
                      ? isRideExpired(ride)
                        ? "ring-red-500"
                        : "ring-green-500"
                      : "ring-blue-500"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <LocationWithTooltip
                        label="From"
                        name={ride.pickup}
                        address={ride.pickupAddress}
                      />
                      <LocationWithTooltip
                        label="To"
                        name={ride.destination}
                        address={ride.destinationAddress}
                      />
                      <div className="flex items-center text-gray-600">
                        <FiClock className="mr-2" />
                        <span>
                          {formatDate(ride.date)} •{" "}
                          {ride.timeRangeStart === ride.timeRangeEnd
                            ? "Start Time"
                            : "Start Time Interval"}{" "}
                          {ride.timeRangeStart === ride.timeRangeEnd
                            ? to12Hour(ride.timeRangeStart)
                            : `${to12Hour(ride.timeRangeStart)} - ${to12Hour(
                                ride.timeRangeEnd
                              )}`}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiUsers className="mr-2" />
                        <span>
                          {ride.isMatched
                            ? `${ride.totalPassengers} Total Passengers`
                            : `${ride.passengers} Passenger${
                                ride.passengers > 1 ? "s" : ""
                              }`}
                        </span>
                      </div>
                    </div>
                    {!ride.isMatched && (
                      <div className="flex flex-col items-center justify-center ml-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <div className="text-sm text-gray-500 mt-2">
                          Finding matches...
                        </div>
                      </div>
                    )}
                    {ride.isMatched && !isRideExpired(ride) && (
                      <Button
                        onClick={() => navigate(`/rides/${ride._id}/details`)}
                        className="ml-4 bg-green-500 hover:bg-green-600 text-white"
                      >
                        View Details
                      </Button>
                    )}
                    {ride.isMatched && isRideExpired(ride) && (
                      <div className="flex flex-col items-center justify-center ml-4">
                        <div className="text-sm text-red-500 font-medium">
                          Expired
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Show matched ride if exists */}
                  {ride.isMatched && ride.matchedRideId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 pt-6 border-t"
                    >
                      <h3
                        className={`text-lg font-semibold mb-4 ${
                          isRideExpired(ride)
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        Matched Ride
                      </h3>
                      <div className="bg-white p-4 rounded-lg shadow-md">
                        <div className="flex items-center text-gray-600 mb-3">
                          <FiMapPin className="mr-2 text-lg" />
                          <span className="text-base">
                            To: {ride.matchedRideId.destination}
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-600">
                            <FiClock className="mr-2 text-lg" />
                            <span className="text-base">
                              Date: {formatDate(ride.date)}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <FiClock className="mr-2 text-lg" />
                            <span className="text-base">
                              {ride.matchedRideId.timeRangeStart ===
                              ride.matchedRideId.timeRangeEnd
                                ? "Start Time"
                                : "Start Time Interval"}{" "}
                              {ride.matchedRideId.timeRangeStart ===
                              ride.matchedRideId.timeRangeEnd
                                ? to12Hour(ride.matchedRideId.timeRangeStart)
                                : `${to12Hour(
                                    ride.matchedRideId.timeRangeStart
                                  )} - ${to12Hour(
                                    ride.matchedRideId.timeRangeEnd
                                  )}`}
                            </span>
                          </div>
                          {getTimeOverlap(
                            ride.timeRangeStart,
                            ride.timeRangeEnd,
                            ride.matchedRideId.timeRangeStart,
                            ride.matchedRideId.timeRangeEnd
                          ) && (
                            <div
                              className={`flex items-center ${
                                isRideExpired(ride)
                                  ? "text-red-600"
                                  : "text-green-600"
                              } font-medium bg-${
                                isRideExpired(ride) ? "red" : "green"
                              }-50 p-3 rounded`}
                            >
                              <FiClock className="mr-2 text-lg" />
                              <div>
                                <div className="text-base">
                                  <span
                                    className={
                                      isRideExpired(ride)
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }
                                  >
                                    {getTimeOverlap(
                                      ride.timeRangeStart,
                                      ride.timeRangeEnd,
                                      ride.matchedRideId.timeRangeStart,
                                      ride.matchedRideId.timeRangeEnd
                                    ) === null
                                      ? "Start Time"
                                      : "Overlapping Start Time Interval"}
                                    :{" "}
                                    {to12Hour(
                                      getTimeOverlap(
                                        ride.timeRangeStart,
                                        ride.timeRangeEnd,
                                        ride.matchedRideId.timeRangeStart,
                                        ride.matchedRideId.timeRangeEnd
                                      )?.start
                                    )}
                                    {getTimeOverlap(
                                      ride.timeRangeStart,
                                      ride.timeRangeEnd,
                                      ride.matchedRideId.timeRangeStart,
                                      ride.matchedRideId.timeRangeEnd
                                    ) !== null &&
                                      ` - ${to12Hour(
                                        getTimeOverlap(
                                          ride.timeRangeStart,
                                          ride.timeRangeEnd,
                                          ride.matchedRideId.timeRangeStart,
                                          ride.matchedRideId.timeRangeEnd
                                        ).end
                                      )}`}
                                  </span>
                                </div>
                                <div
                                  className={`text-sm ${
                                    isRideExpired(ride)
                                      ? "text-red-500"
                                      : "text-green-500"
                                  } mt-1`}
                                >
                                  (
                                  {Math.floor(
                                    getTimeOverlap(
                                      ride.timeRangeStart,
                                      ride.timeRangeEnd,
                                      ride.matchedRideId.timeRangeStart,
                                      ride.matchedRideId.timeRangeEnd
                                    ).duration / 60
                                  )}
                                  h{" "}
                                  {getTimeOverlap(
                                    ride.timeRangeStart,
                                    ride.timeRangeEnd,
                                    ride.matchedRideId.timeRangeStart,
                                    ride.matchedRideId.timeRangeEnd
                                  ).duration % 60}
                                  m overlap)
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>
    </MainLayout>
  );
};

export default MyRides;

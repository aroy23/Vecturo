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

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    // Check for lastCreatedRideId when rides are loaded
    const lastCreatedRideId = localStorage.getItem("lastCreatedRideId");
    if (lastCreatedRideId && rides.length > 0) {
      const newRide = rides.find((ride) => ride._id === lastCreatedRideId);
      if (newRide) {
        handleFindMatches(newRide);
        // Clear the stored ID after using it
        localStorage.removeItem("lastCreatedRideId");
      }
    }
  }, [rides]);

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
      console.error("Error fetching rides:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const findMatches = async (rideId) => {
    setMatchLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Please log in to find matches");

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
      setMatches(matchData);

      if (matchData.length === 0) {
        setError("No matches found nearby. We'll keep looking!");
        // Clear the error message after 2 seconds
        setTimeout(() => {
          setError(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Error finding matches:", error);
      setError(error.message);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleFindMatches = (ride) => {
    setSelectedRide(ride);
    findMatches(ride._id);
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
            View and manage your ride requests
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
                    ride.isMatched ? "ring-green-500" : "ring-blue-500"
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
                          {to12Hour(ride.timeRangeStart)} -{" "}
                          {to12Hour(ride.timeRangeEnd)}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiUsers className="mr-2" />
                        <span>{ride.passengers} passenger(s)</span>
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
                    {ride.isMatched && (
                      <Button
                        onClick={() => navigate(`/rides/${ride._id}/details`)}
                        className="ml-4 bg-green-500 hover:bg-green-600 text-white"
                      >
                        View Details
                      </Button>
                    )}
                  </div>

                  {/* Show matched ride if exists */}
                  {ride.isMatched && ride.matchedRideId && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 pt-6 border-t"
                    >
                      <h3 className="text-lg font-semibold mb-4 text-green-600">
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
                              Their time:{" "}
                              {to12Hour(ride.matchedRideId.timeRangeStart)} -{" "}
                              {to12Hour(ride.matchedRideId.timeRangeEnd)}
                            </span>
                          </div>
                          {getTimeOverlap(
                            ride.timeRangeStart,
                            ride.timeRangeEnd,
                            ride.matchedRideId.timeRangeStart,
                            ride.matchedRideId.timeRangeEnd
                          ) && (
                            <div className="flex items-center text-green-600 font-medium bg-green-50 p-3 rounded">
                              <FiClock className="mr-2 text-lg" />
                              <div>
                                <div className="text-base">
                                  Overlapping time:{" "}
                                  {to12Hour(
                                    getTimeOverlap(
                                      ride.timeRangeStart,
                                      ride.timeRangeEnd,
                                      ride.matchedRideId.timeRangeStart,
                                      ride.matchedRideId.timeRangeEnd
                                    ).start
                                  )}{" "}
                                  -{" "}
                                  {to12Hour(
                                    getTimeOverlap(
                                      ride.timeRangeStart,
                                      ride.timeRangeEnd,
                                      ride.matchedRideId.timeRangeStart,
                                      ride.matchedRideId.timeRangeEnd
                                    ).end
                                  )}
                                </div>
                                <div className="text-sm text-green-500 mt-1">
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

                  {/* Show potential matches for selected ride */}
                  {!ride.isMatched &&
                    selectedRide?._id === ride._id &&
                    matches.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 pt-6 border-t"
                      >
                        <h3 className="text-lg font-semibold mb-4">
                          Potential Matches
                        </h3>
                        <div className="space-y-4">
                          {matches.map((match) => {
                            const overlap = getTimeOverlap(
                              ride.timeRangeStart,
                              ride.timeRangeEnd,
                              match.timeRangeStart,
                              match.timeRangeEnd
                            );

                            return (
                              <div
                                key={match._id}
                                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                              >
                                <div className="flex items-center text-gray-600 mb-2">
                                  <FiMapPin className="mr-2" />
                                  <span title={match.destinationAddress}>
                                    To: {match.destination}
                                  </span>
                                </div>
                                <div className="text-sm space-y-2">
                                  <div className="flex items-center text-gray-600">
                                    <FiClock className="mr-2" />
                                    <span>Date: {formatDate(match.date)}</span>
                                  </div>
                                  <div className="flex items-center text-gray-600">
                                    <FiClock className="mr-2" />
                                    <span>
                                      Their time:{" "}
                                      {to12Hour(match.timeRangeStart)} -{" "}
                                      {to12Hour(match.timeRangeEnd)}
                                    </span>
                                  </div>
                                  {overlap && (
                                    <div className="flex items-center text-green-600 font-medium bg-green-50 p-2 rounded">
                                      <FiClock className="mr-2" />
                                      <div>
                                        <div>
                                          Overlapping time:{" "}
                                          {to12Hour(overlap.start)} -{" "}
                                          {to12Hour(overlap.end)}
                                        </div>
                                        <div className="text-xs text-green-500">
                                          ({Math.floor(overlap.duration / 60)}h{" "}
                                          {overlap.duration % 60}m overlap)
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center text-gray-600 mt-2">
                                  <FiUsers className="mr-2" />
                                  <span>{match.passengers} passenger(s)</span>
                                </div>
                                <div className="mt-4">
                                  <Button
                                    onClick={() => {
                                      console.log("Match selected:", match._id);
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white w-full"
                                  >
                                    Select Match
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
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

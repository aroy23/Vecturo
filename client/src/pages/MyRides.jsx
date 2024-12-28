import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiClock, FiMapPin, FiUsers } from "react-icons/fi";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/ui/Button";

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

const MyRides = () => {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);

  useEffect(() => {
    fetchRides();
  }, []);

  useEffect(() => {
    // Check for lastCreatedRideId when rides are loaded
    const lastCreatedRideId = localStorage.getItem("lastCreatedRideId");
    if (lastCreatedRideId && rides.length > 0) {
      const newRide = rides.find(ride => ride._id === lastCreatedRideId);
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

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
            <motion.div
              variants={fadeIn}
              className="text-center text-gray-600"
            >
              You haven't created any rides yet.
            </motion.div>
          ) : (
            <motion.div variants={fadeIn} className="space-y-6 max-w-3xl mx-auto">
              {rides.map((ride) => (
                <div
                  key={ride._id}
                  className={`bg-white p-6 rounded-lg shadow-md transition-all ${
                    selectedRide?._id === ride._id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600">
                        <FiMapPin className="mr-2" />
                        <span>From: {ride.pickup}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiMapPin className="mr-2" />
                        <span>To: {ride.destination}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiClock className="mr-2" />
                        <span>
                          {formatDate(ride.date)} • {ride.timeRangeStart} - {ride.timeRangeEnd}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiUsers className="mr-2" />
                        <span>{ride.passengers} passenger(s)</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleFindMatches(ride)}
                      disabled={matchLoading && selectedRide?._id === ride._id}
                      className="ml-4"
                    >
                      {matchLoading && selectedRide?._id === ride._id
                        ? "Finding..."
                        : "Find Matches"}
                    </Button>
                  </div>

                  {/* Show matches for selected ride */}
                  {selectedRide?._id === ride._id && matches.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 pt-6 border-t"
                    >
                      <h3 className="text-lg font-semibold mb-4">Potential Matches</h3>
                      <div className="space-y-4">
                        {matches.map((match) => (
                          <div
                            key={match._id}
                            className="bg-gray-50 p-4 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center text-gray-600">
                                  <FiMapPin className="mr-2" />
                                  <span>From: {match.pickup}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <FiMapPin className="mr-2" />
                                  <span>To: {match.destination}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <FiClock className="mr-2" />
                                  <span>
                                    {match.timeRangeStart} - {match.timeRangeEnd}
                                  </span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <FiUsers className="mr-2" />
                                  <span>{match.passengers} passenger(s)</span>
                                </div>
                                {match.distanceMiles && (
                                  <div className="text-sm text-blue-600">
                                    {match.distanceMiles} miles away
                                  </div>
                                )}
                              </div>
                              <Button
                                onClick={() => {
                                  // TODO: Implement match confirmation
                                  console.log("Match selected:", match._id);
                                }}
                                className="bg-green-500 hover:bg-green-600 ml-4"
                              >
                                Select Match
                              </Button>
                            </div>
                          </div>
                        ))}
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

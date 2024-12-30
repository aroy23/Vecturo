import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiClock, FiMapPin, FiUsers, FiArrowLeft } from "react-icons/fi";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/ui/Button";
import { to12Hour, formatDate, getTimeOverlap } from "../utils/timeUtils";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
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

const MatchedRideDetails = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) throw new Error("Please log in to view ride details");

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/rides/${rideId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch ride details");
        }

        const data = await response.json();
        setRide(data);
      } catch (error) {
        console.error("Error fetching ride details:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, [rideId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container-padding py-20">
          <div className="max-w-3xl mx-auto">
            <Button onClick={() => navigate("/my-rides")} className="mb-6">
              <FiArrowLeft className="mr-2" /> Back to My Rides
            </Button>
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!ride) {
    return (
      <MainLayout>
        <div className="container-padding py-20">
          <div className="max-w-3xl mx-auto">
            <Button onClick={() => navigate("/my-rides")} className="mb-6">
              <FiArrowLeft className="mr-2" /> Back to My Rides
            </Button>
            <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg">
              Ride not found
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-padding py-20">
        <div className="max-w-3xl mx-auto">
          <Button onClick={() => navigate("/my-rides")} className="mb-6">
            <FiArrowLeft className="mr-2" /> Back to My Rides
          </Button>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h1 className="text-2xl font-bold mb-6 text-gray-900">
              Matched Ride Details
            </h1>

            <div className="space-y-6">
              {/* Your Ride Details */}
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-800">
                  Your Ride
                </h2>
                <div className="space-y-3">
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
                      {formatDate(ride.date)} • {to12Hour(ride.timeRangeStart)} -{" "}
                      {to12Hour(ride.timeRangeEnd)}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FiUsers className="mr-2" />
                    <span>{ride.passengers} passenger(s)</span>
                  </div>
                </div>
              </div>

              {/* Matched Ride Details */}
              {ride.matchedRideId && (
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800">
                    Matched With
                  </h2>
                  <div className="space-y-3">
                    <LocationWithTooltip
                      label="From"
                      name={ride.matchedRideId.pickup}
                      address={ride.matchedRideId.pickupAddress}
                    />
                    <LocationWithTooltip
                      label="To"
                      name={ride.matchedRideId.destination}
                      address={ride.matchedRideId.destinationAddress}
                    />
                    <div className="flex items-center text-gray-600">
                      <FiClock className="mr-2" />
                      <span>
                        {formatDate(ride.matchedRideId.date)} •{" "}
                        {to12Hour(ride.matchedRideId.timeRangeStart)} -{" "}
                        {to12Hour(ride.matchedRideId.timeRangeEnd)}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <FiUsers className="mr-2" />
                      <span>{ride.matchedRideId.passengers} passenger(s)</span>
                    </div>
                  </div>

                  {/* Time Overlap */}
                  {getTimeOverlap(
                    ride.timeRangeStart,
                    ride.timeRangeEnd,
                    ride.matchedRideId.timeRangeStart,
                    ride.matchedRideId.timeRangeEnd
                  ) && (
                    <div className="mt-4">
                      <div className="flex items-center text-green-600 font-medium bg-green-50 p-4 rounded-lg">
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
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MatchedRideDetails;

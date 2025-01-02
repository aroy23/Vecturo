import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiClock,
  FiMapPin,
  FiUsers,
  FiArrowLeft,
  FiNavigation,
  FiExternalLink,
  FiTruck,
} from "react-icons/fi";
import { GoogleMap, Polyline, Marker } from "@react-google-maps/api";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/ui/Button";
import { useMaps } from "../contexts/MapsContext";
import { to12Hour, formatDate, getTimeOverlap } from "../utils/timeUtils";
import axios from "axios";

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

const MapWithDirections = ({
  pickupPlaceID,
  startingPointPlaceID,
  mode = "WALKING",
}) => {
  const { isLoaded } = useMaps();
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [placeDetails, setPlaceDetails] = useState({
    origin: null,
    destination: null,
  });

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  // Default center (will be updated with user's location)
  const center = userLocation || {
    lat: 40.7128,
    lng: -74.006,
  };

  const options = {
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: "all",
        elementType: "geometry",
        stylers: [{ visibility: "simplified" }],
      },
    ],
  };

  // Function to get place details
  const getPlaceDetails = useCallback(
    async (placeId) => {
      if (!window.google || !placeId) return null;

      const placesService = new window.google.maps.places.PlacesService(map);

      return new Promise((resolve, reject) => {
        placesService.getDetails(
          {
            placeId: placeId,
            fields: ["geometry", "formatted_address"],
          },
          (result, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
              resolve(result);
            } else {
              reject(new Error("Failed to get place details"));
            }
          }
        );
      });
    },
    [map]
  );

  const openInGoogleMaps = useCallback((origin, destination) => {
    if (!origin || !destination) return;

    const url = `https://www.google.com/maps/dir/?api=1&origin=place_id:${origin}&destination=place_id:${destination}&travelmode=${mode.toLowerCase()}`;
    window.open(url, "_blank");
  }, [mode]);

  // Get place details when map is loaded
  useEffect(() => {
    if (!map || !pickupPlaceID || !startingPointPlaceID) return;

    const fetchPlaceDetails = async () => {
      try {
        const [origin, destination] = await Promise.all([
          getPlaceDetails(pickupPlaceID),
          getPlaceDetails(startingPointPlaceID),
        ]);
        setPlaceDetails({ origin, destination });
      } catch (error) {
        console.error("Error fetching place details:", error);
      }
    };

    fetchPlaceDetails();
  }, [map, pickupPlaceID, startingPointPlaceID, getPlaceDetails]);

  // Get user's location
  useEffect(() => {
    if (!isLoaded || !map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLatLng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLatLng);

          // Create or update user location marker
          if (userMarker) {
            userMarker.setPosition(userLatLng);
          } else {
            const marker = new window.google.maps.Marker({
              position: userLatLng,
              map: map,
              title: "Your Location",
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#4299E1",
                fillOpacity: 1,
                strokeColor: "#FFFFFF",
                strokeWeight: 2,
              },
            });
            setUserMarker(marker);
          }

          // Only center on user location if no directions are shown yet
          if (!directionsRenderer?.getDirections()) {
            map.setCenter(userLatLng);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          setError(
            "Could not get your location. Please ensure location services are enabled."
          );
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, [map, isLoaded]);

  useEffect(() => {
    if (!isLoaded || !map) return;

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: "#4299E1", // Blue color for all routes
        strokeWeight: 4,
      },
      markerOptions: {
        origin: {
          label: {
            text: "A",
            color: "#FFFFFF",
            fontWeight: "bold",
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4299E1",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
        },
        destination: {
          label: {
            text: "B",
            color: "#FFFFFF",
            fontWeight: "bold",
          },
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#4299E1",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
          },
        },
      },
    });

    setDirectionsService(directionsService);
    setDirectionsRenderer(directionsRenderer);
    setLoading(false);
  }, [map, isLoaded, mode]);

  useEffect(() => {
    if (
      !directionsService ||
      !directionsRenderer ||
      !pickupPlaceID ||
      !startingPointPlaceID
    )
      return;

    const fetchDirections = async () => {
      try {
        const result = await directionsService.route({
          origin: { placeId: pickupPlaceID },
          destination: { placeId: startingPointPlaceID },
          travelMode: window.google.maps.TravelMode[mode],
        });

        directionsRenderer.setDirections(result);

        // Extract and set route information
        const route = result.routes[0];
        if (route && route.legs[0]) {
          const leg = route.legs[0];
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
            mode: mode,
          });
        }

        // If we have user location, make sure the marker stays visible
        if (userMarker) {
          userMarker.setMap(map);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        setError("Failed to load directions");
      }
    };

    fetchDirections();
  }, [
    directionsService,
    directionsRenderer,
    pickupPlaceID,
    startingPointPlaceID,
    userMarker,
    map,
    mode,
  ]);

  const onLoad = React.useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(() => {
    if (userMarker) {
      userMarker.setMap(null);
    }
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
    }
    setMap(null);
  }, [directionsRenderer, userMarker]);

  if (!isLoaded) {
    return (
      <div className="h-[400px] w-full bg-gray-100 flex items-center justify-center">
        Loading Google Maps...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {routeInfo && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm mb-2">
          <div className="flex items-center text-gray-600">
            {mode === "WALKING" ? (
              <FiNavigation className="mr-2" />
            ) : (
              <FiTruck className="mr-2" />
            )}
            <span>
              {routeInfo.distance} • {routeInfo.duration}{" "}
              {routeInfo.mode.toLowerCase()}
            </span>
          </div>
        </div>
      )}
      <div className="h-[400px] w-full rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={14}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={options}
        />
      </div>
    </div>
  );
};

const RideInstructions = ({ ride }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start">
        <FiNavigation className="mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-gray-800">
            Get to the meeting point
          </h3>
          {ride.pickupPlaceID === ride.startingPointPlaceID ? (
            <p className="text-sm text-gray-700 mt-1">
              You're already at the meeting point ({ride.startingPoint}). Wait
              for the other rider to arrive.
            </p>
          ) : (
            <p className="text-sm text-gray-700 mt-1">
              Walk to the meeting point at {ride.startingPoint}
            </p>
          )}
        </div>
      </div>

      {ride.pickupPlaceID !== ride.startingPointPlaceID && (
        <>
          <div className="flex items-start">
            <FiMapPin className="mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                {ride.pickupAddress}
              </h3>
              <p className="text-xs text-gray-500">Point A</p>
            </div>
          </div>

          <div className="flex items-start">
            <FiMapPin className="mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                {ride.startingPointAddress}
              </h3>
              <p className="text-xs text-gray-500">Point B</p>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm mb-2">
              <div className="flex items-center text-gray-600">
                <FiNavigation className="mr-2" />
                <span>Walking directions</span>
              </div>
              <button
                onClick={() =>
                  openInGoogleMaps(ride.pickupPlaceID, ride.startingPointPlaceID)
                }
                className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <FiExternalLink className="mr-1" />
                Open in Google Maps
              </button>
            </div>
            <MapWithDirections
              pickupPlaceID={ride.pickupPlaceID}
              startingPointPlaceID={ride.startingPointPlaceID}
              mode="WALKING"
            />
          </div>
        </>
      )}
    </div>
  );
};

const MatchedRideDetails = () => {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);
  const [matchedRide, setMatchedRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useMaps();

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        // Get the first ride
        const response = await axios.get(`/api/rides/${rideId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        setRide(response.data);

        // If there's a matched ride, get its details
        if (response.data.matchedRideId) {
          const matchedResponse = await axios.get(
            `/api/rides/${response.data.matchedRideId}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
            }
          );
          setMatchedRide(matchedResponse.data);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching ride details:", error);
        setError(error.response?.data?.error || "Failed to load ride details");
        setLoading(false);
      }
    };

    if (rideId) {
      fetchRideDetails();
    }
  }, [rideId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container-padding py-20">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container-padding py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-red-600">
              Error loading ride details: {error}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!ride || !matchedRide) {
    return (
      <MainLayout>
        <div className="container-padding py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-gray-600">Ride not found</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate overlapping time
  const rideStart = convertTimeToMinutes(ride.timeRangeStart);
  const rideEnd = convertTimeToMinutes(ride.timeRangeEnd);
  const matchedStart = convertTimeToMinutes(matchedRide.timeRangeStart);
  const matchedEnd = convertTimeToMinutes(matchedRide.timeRangeEnd);

  const overlapStart = Math.max(rideStart, matchedStart);
  const overlapEndTime = Math.min(rideEnd, matchedEnd);
  const overlapStartTime = minutesToTime(overlapStart);
  const overlapEndTimeText = minutesToTime(overlapEndTime);

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
                      {formatDate(ride.date)} • {overlapStartTime} - {overlapEndTimeText}
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
                <>
                  <div className="border-t pt-6">
                    <h2 className="text-base font-semibold mb-3 text-gray-800">
                      Step 1: Meeting Instructions
                    </h2>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-700">
                        <RideInstructions ride={ride} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h2 className="text-base font-semibold mb-3 text-gray-800">
                      Step 2: Ride Details
                    </h2>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                      <div className="flex items-center text-sm text-gray-700">
                        <FiClock className="mr-2 text-blue-600" />
                        <span>Take your rideshare at {overlapStartTime}:</span>
                      </div>

                      {/* Starting Point */}
                      <div className="flex items-start">
                        <FiMapPin className="mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">
                            {ride.startingPointAddress}
                          </h3>
                          <p className="text-xs text-gray-500">Point A</p>
                        </div>
                      </div>

                      {/* Ending Point */}
                      <div className="flex items-start">
                        <FiMapPin className="mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">
                            {ride.endingPointAddress}
                          </h3>
                          <p className="text-xs text-gray-500">Point B</p>
                        </div>
                      </div>

                      <div className="rounded-lg overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm mb-2">
                          <div className="flex items-center text-gray-600">
                            <FiTruck className="mr-2" />
                            <span>Driving directions</span>
                          </div>
                          <button
                            onClick={() =>
                              openInGoogleMaps(
                                ride.startingPointPlaceID,
                                ride.endingPointPlaceID
                              )
                            }
                            className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <FiExternalLink className="mr-1" />
                            Open in Google Maps
                          </button>
                        </div>
                        <MapWithDirections
                          pickupPlaceID={ride.startingPointPlaceID}
                          startingPointPlaceID={ride.endingPointPlaceID}
                          mode="DRIVING"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Dropoff Instructions */}
                  <div className="border-t pt-6">
                    <h2 className="text-base font-semibold mb-3 text-gray-800">
                      Step 3: Dropoff Instructions
                    </h2>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                      <div className="flex items-start">
                        <FiNavigation className="mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">
                            Get to your destination
                          </h3>
                          {ride.destinationPlaceID ===
                          ride.endingPointPlaceID ? (
                            <p className="text-sm text-gray-700 mt-1">
                              You've been dropped off at your destination (
                              {ride.destinationAddress}). Have a great day!
                            </p>
                          ) : (
                            <p className="text-sm text-gray-700 mt-1">
                              Walk to your destination at{" "}
                              {ride.destinationAddress}
                            </p>
                          )}
                        </div>
                      </div>

                      {ride.destinationPlaceID !== ride.endingPointPlaceID && (
                        <>
                          <div className="flex items-start">
                            <FiMapPin className="mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
                            <div>
                              <h3 className="text-sm font-medium text-gray-800">
                                {ride.endingPointAddress}
                              </h3>
                              <p className="text-xs text-gray-500">Point A</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <FiMapPin className="mt-0.5 mr-2 text-blue-600 flex-shrink-0" />
                            <div>
                              <h3 className="text-sm font-medium text-gray-800">
                                {ride.destinationAddress}
                              </h3>
                              <p className="text-xs text-gray-500">Point B</p>
                            </div>
                          </div>

                          <div className="rounded-lg overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm mb-2">
                              <div className="flex items-center text-gray-600">
                                <FiNavigation className="mr-2" />
                                <span>Walking directions</span>
                              </div>
                              <button
                                onClick={() =>
                                  openInGoogleMaps(
                                    ride.endingPointPlaceID,
                                    ride.destinationPlaceID
                                  )
                                }
                                className="flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
                              >
                                <FiExternalLink className="mr-1" />
                                Open in Google Maps
                              </button>
                            </div>
                            <MapWithDirections
                              pickupPlaceID={ride.endingPointPlaceID}
                              startingPointPlaceID={ride.destinationPlaceID}
                              mode="WALKING"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

// Helper function to convert time string to minutes
const convertTimeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes to time string
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
};

export default MatchedRideDetails;

import React, { useState, useEffect, useRef } from "react";
import { FiMapPin } from "react-icons/fi";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google) {
      resolve(window.google);
      return;
    }

    if (document.querySelector("#google-maps-script")) {
      // Script is already loading
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          resolve(window.google);
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(window.google);
    };

    script.onerror = (error) => {
      reject(new Error("Failed to load Google Maps API"));
    };

    document.head.appendChild(script);
  });
};

const LocationAutocomplete = ({ value, onChange, onSelect, label }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);
  const autocompleteRef = useRef(null);
  const placesServiceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initializeGoogleMaps = async () => {
      try {
        await loadGoogleMapsScript();
        if (
          isMounted &&
          window.google &&
          window.google.maps &&
          window.google.maps.places
        ) {
          autocompleteRef.current =
            new window.google.maps.places.AutocompleteService();
          // Initialize PlacesService with a dummy div (required by Google Maps API)
          const mapDiv = document.createElement("div");
          const map = new window.google.maps.Map(mapDiv);
          placesServiceRef.current =
            new window.google.maps.places.PlacesService(map);
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setError(
          "Unable to load location suggestions. Please try again later."
        );
      }
    };

    initializeGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  const getPlaceDetails = async (placeId) => {
    return new Promise((resolve, reject) => {
      const request = {
        placeId: placeId,
        fields: ["formatted_address", "geometry", "address_components"],
      };

      placesServiceRef.current.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const zipCode =
            place.address_components.find((component) =>
              component.types.includes("postal_code")
            )?.short_name || "";

          const locationDetails = {
            description: place.formatted_address,
            place_id: placeId,
            zipCode,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          resolve(locationDetails);
        } else {
          reject(new Error("Failed to get place details"));
        }
      });
    });
  };

  const handleInput = async (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    if (!autocompleteRef.current) {
      console.warn("Google Maps API not loaded yet");
      return;
    }

    if (inputValue.length > 0) {
      try {
        const request = {
          input: inputValue,
          componentRestrictions: { country: "us" },
        };

        const { predictions } = await new Promise((resolve, reject) => {
          autocompleteRef.current.getPlacePredictions(
            request,
            (predictions, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                resolve({ predictions });
              } else {
                reject(new Error("Failed to get predictions"));
              }
            }
          );
        });

        setSuggestions(predictions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error getting predictions:", error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    try {
      const locationDetails = await getPlaceDetails(suggestion.place_id);
      onSelect(locationDetails);
      setShowSuggestions(false);
      setSuggestions([]);
    } catch (error) {
      console.error("Error getting place details:", error);
      setError("Error getting location details");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="form-group">
      <label
        htmlFor="location"
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      <div className="relative mt-1" ref={inputRef}>
        <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          id="location"
          value={value}
          onChange={handleInput}
          className="input pl-10 w-full"
          required
        />
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white mt-1 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.place_id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {suggestion.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LocationAutocomplete;

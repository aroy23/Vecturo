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

  const getPlaceDetails = async (placeId, suggestion) => {
    return new Promise((resolve, reject) => {
      const request = {
        placeId: placeId,
        fields: ["formatted_address", "geometry", "address_components"],
      };

      placesServiceRef.current.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          console.log('Place details received:', place);

          const locationDetails = {
            description: place.formatted_address,
            displayText: suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0],
            place_id: placeId,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          
          console.log('Location details prepared:', locationDetails);
          resolve(locationDetails);
        } else {
          console.error('Failed to get place details, status:', status);
          reject(new Error("Failed to get place details"));
        }
      });
    });
  };

  const handleSuggestionClick = async (suggestion) => {
    try {
      console.log('Suggestion clicked:', suggestion);
      const locationDetails = await getPlaceDetails(suggestion.place_id, suggestion);
      onSelect(locationDetails);
      setShowSuggestions(false);
      setSuggestions([]);
    } catch (error) {
      console.error("Error getting place details:", error);
      setError("Error getting location details");
    }
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
      {label && (
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative mt-1" ref={inputRef}>
        <input
          type="text"
          id="location"
          value={value?.displayText || value || ''}
          onChange={handleInput}
          className="w-full py-3 pl-12 bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          placeholder="Enter location..."
          required
        />
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 w-full bg-white mt-1 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.place_id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <div className="font-medium">
                  {suggestion.structured_formatting?.main_text}
                </div>
                <div className="text-sm text-gray-600">
                  {suggestion.structured_formatting?.secondary_text}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LocationAutocomplete;

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

const LocationAutocomplete = ({ value, onChange, placeholder, label, id }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState(null);
  const autocompleteRef = useRef(null);
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
          types: ["establishment", "geocode"],
        };

        autocompleteRef.current.getPlacePredictions(
          request,
          (predictions, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setSuggestions(predictions);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }
        );
      } catch (error) {
        console.error("Error getting place predictions:", error);
        setError("Error getting location suggestions");
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setShowSuggestions(false);
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
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1" ref={inputRef}>
        <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          id={id}
          value={value}
          onChange={handleInput}
          placeholder={placeholder}
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

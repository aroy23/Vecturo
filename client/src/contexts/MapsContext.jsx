import React, { createContext, useContext, useState, useCallback } from 'react';
import { LoadScript, useLoadScript } from '@react-google-maps/api';

const libraries = ["places", "geometry", "drawing"];
const MapsContext = createContext(null);

function MapsProvider({ children }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <MapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapsContext.Provider>
  );
}

function useMaps() {
  const context = useContext(MapsContext);
  if (context === undefined) {
    throw new Error('useMaps must be used within a MapsProvider');
  }
  return context;
}

export { MapsProvider, useMaps };

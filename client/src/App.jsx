import { ChakraProvider, CSSReset } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { MapsProvider } from "./contexts/MapsContext";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import RideRequest from "./pages/RideRequest";
import MyRides from "./pages/MyRides";
import MatchedRideDetails from "./pages/MatchedRideDetails";
import PrivateRoute from "./components/auth/PrivateRoute";

function App() {
  return (
    <ChakraProvider>
      <CSSReset />
      <AuthProvider>
        <MapsProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <HomePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/home"
                element={<Navigate to="/" replace />}
              />
              <Route
                path="/ride-request"
                element={
                  <PrivateRoute>
                    <RideRequest />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-rides"
                element={
                  <PrivateRoute>
                    <MyRides />
                  </PrivateRoute>
                }
              />
              <Route
                path="/rides/:rideId/details"
                element={
                  <PrivateRoute>
                    <MatchedRideDetails />
                  </PrivateRoute>
                }
              />

              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </MapsProvider>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;

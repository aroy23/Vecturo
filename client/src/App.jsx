import { ChakraProvider, CSSReset } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
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
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;

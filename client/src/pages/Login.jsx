import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Text,
  useToast,
  Container,
  VStack,
} from "@chakra-ui/react";
import { auth } from "../config/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import PhonePopup from "../components/PhonePopup";
import axios from "axios";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      console.log("Starting Google sign in...");
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("Google sign in successful");

      // Get the ID token
      const idToken = await result.user.getIdToken();
      console.log("Got ID token");

      // Store the token
      localStorage.setItem("authToken", idToken);
      localStorage.setItem("userId", result.user.uid);
      setUserData(result.user);

      try {
        // Try to get user data
        const userResponse = await axios.get(`/api/users/${result.user.uid}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (userResponse.data && userResponse.data.phoneNumber) {
          // User exists and has phone number, proceed to home
          toast({
            title: "Success",
            description: "Successfully signed in with Google",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          navigate("/home");
        } else {
          // User exists but no phone number
          setShowPhoneModal(true);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          // New user, show phone modal
          setShowPhoneModal(true);
        } else {
          // Some other error occurred
          throw error;
        }
      }
    } catch (error) {
      console.error("Full sign-in error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
        <VStack spacing={4}>
          <Text fontSize="2xl" fontWeight="bold">
            Vecturo
          </Text>
          <Text color="gray.600" textAlign="center">
            Share Rides and Save on Travel Costs
          </Text>

          <Button
            w="full"
            size="lg"
            onClick={handleGoogleSignIn}
            isLoading={loading}
            leftIcon={<FcGoogle />}
            _hover={{ bg: "gray.100" }}
          >
            Continue with Google
          </Button>
        </VStack>
      </Box>

      <PhonePopup
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        currentUser={userData}
        onSuccess={() => navigate("/home")}
      />
    </Container>
  );
}

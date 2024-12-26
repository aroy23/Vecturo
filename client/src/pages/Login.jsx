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
import axios from "axios";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Get the ID token
      const idToken = await result.user.getIdToken();

      // Store the token
      localStorage.setItem("authToken", idToken);

      // Create/update user in MongoDB
      await axios.post("/api/users", {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        phoneNumber: result.user.phoneNumber,
      });

      toast({
        title: "Success",
        description: "Successfully signed in with Google",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/home");
    } catch (error) {
      console.error("Sign-in error:", error);
      toast({
        title: "Error",
        description: error.message,
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
    </Container>
  );
}

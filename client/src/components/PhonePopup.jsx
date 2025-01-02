import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Button,
  useToast,
} from "@chakra-ui/react";
import axios from "axios";

const PhonePopup = ({ isOpen, onClose, currentUser, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const toast = useToast();

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, "");

    // Format the number as user types
    let formatted = "";
    if (cleaned.length <= 3) {
      formatted = cleaned;
    } else if (cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
        6,
        10
      )}`;
    }

    return formatted;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate phone number
      const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error("Please enter a valid 10-digit phone number");
      }

      // Update user in MongoDB with phone number
      await axios.post(
        "/api/users",
        {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          phoneNumber: phoneNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${await currentUser.getIdToken()}`,
          },
        }
      );

      toast({
        title: "Success",
        description: "Phone number updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Phone update error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Update Phone Number</ModalHeader>
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>Phone Number</FormLabel>
            <InputGroup>
              <InputLeftAddon children="+1" />
              <Input
                type="tel"
                placeholder="123-456-7890"
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={12} // Account for hyphens
              />
            </InputGroup>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={loading}
          >
            Update
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PhonePopup;

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, MenuItem, MenuItems, MenuButton } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [profileUrl, setProfileUrl] = useState(null);

  useEffect(() => {
    if (currentUser?.photoURL) {
      setProfileUrl(currentUser.photoURL);
    }
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen min-w-[100vw] bg-gradient-to-br from-gray-50 to-gray-100 overflow-x-auto">
      <div className="min-w-[1024px]">
        <header className="fixed w-full min-w-[1024px] bg-white/80 backdrop-blur-md shadow-sm z-50">
          <div className="container-padding flex justify-between items-center py-3">
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold gradient-text ml-4 md:ml-0 cursor-pointer"
                onClick={() => navigate("/home")}
              >
                Vecturo
              </motion.div>
              <div className="hidden md:flex items-center space-x-8">
                <nav className="flex space-x-8">
                  <motion.button
                    onClick={() => navigate("/home")}
                    className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:bg-gray-100 active:bg-gray-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Home
                  </motion.button>
                  <motion.button
                    onClick={() => navigate("/my-rides")}
                    className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:bg-gray-100 active:bg-gray-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    My Rides
                  </motion.button>
                  <motion.a
                    href="#features"
                    className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:bg-gray-100 active:bg-gray-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Features
                  </motion.a>
                </nav>
              </div>
            </div>
            <Menu as="div" className="relative">
              <MenuButton className="flex items-center space-x-2">
                {profileUrl && (
                  <img
                    src={profileUrl}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </MenuButton>
              <MenuItems
                as={motion.div}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <MenuItem>
                  {({ focus }) => (
                    <button
                      onClick={handleSignOut}
                      className={`${
                        focus ? "bg-gray-100" : ""
                      } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                    >
                      Sign Out
                    </button>
                  )}
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </header>

        <main className="pt-8">{children}</main>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-900 text-white py-8 min-w-[1024px]"
        >
          <div className="container-padding text-center">
            <p>&copy; 2024 Vecturo. All rights reserved.</p>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default MainLayout;

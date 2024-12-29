import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, MenuItem, MenuItems, MenuButton } from "@headlessui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const [profileUrl, setProfileUrl] = useState(null);

  const isHomePage = location.pathname === "/home";

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold gradient-text cursor-pointer"
                  onClick={() => navigate("/home")}
                >
                  Vecturo
                </motion.div>
                <nav className="hidden md:flex items-center gap-1">
                  <motion.button
                    onClick={() => navigate("/home")}
                    className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:bg-gray-100 active:bg-gray-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Home
                  </motion.button>
                  {currentUser && (
                    <motion.button
                      onClick={() => navigate("/my-rides")}
                      className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:bg-gray-100 active:bg-gray-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      My Rides
                    </motion.button>
                  )}
                  {isHomePage && (
                    <motion.a
                      href="#features"
                      className="px-4 py-2 rounded-full text-gray-700 hover:text-gray-900 font-medium transition-all duration-200 hover:bg-gray-100 active:bg-gray-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Features
                    </motion.a>
                  )}
                </nav>
              </div>
              <div className="flex items-center gap-4">
                {currentUser ? (
                  <>
                    <motion.button
                      onClick={() => navigate("/ride-request")}
                      className="px-4 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Ride
                    </motion.button>
                    <Menu as="div" className="relative">
                      <MenuButton className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                        {profileUrl && (
                          <img
                            src={profileUrl}
                            alt="Profile"
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-200"
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
                          {({ active }) => (
                            <button
                              onClick={handleSignOut}
                              className={`${
                                active ? "bg-gray-100" : ""
                              } block w-full px-4 py-2 text-left text-sm text-gray-700`}
                            >
                              Sign Out
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Menu>
                  </>
                ) : (
                  <motion.button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 rounded-full bg-blue-500 text-white font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Sign In
                  </motion.button>
                )}
              </div>
            </div>
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

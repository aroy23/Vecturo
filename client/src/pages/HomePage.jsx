import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowRight, FiUsers, FiDollarSign, FiShield } from "react-icons/fi";
import MainLayout from "../layouts/MainLayout";
import Button from "../components/ui/Button";
import ThreeScene from "../components/ThreeScene";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const Homepage = () => {
  const navigate = useNavigate();
  return (
    <MainLayout>
      <section className="relative min-h-screen">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-secondary-600/10 -z-10" />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="container-padding text-center pt-40"
        >
          <motion.h1 variants={fadeIn} className="mb-6">
            Share Rides, <span className="gradient-text">Save Costs</span>
          </motion.h1>
          <motion.p
            variants={fadeIn}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Connecting People for Affordable and Eco-Friendly Ridesharing.
          </motion.p>
          <motion.div variants={fadeIn} className="mb-12">
            <Button className="gap-2" onClick={() => navigate("/ride-request")}>
              Get Started <FiArrowRight className="inline" />
            </Button>
          </motion.div>
          <motion.div
            variants={fadeIn}
            className="relative z-10 max-w-5xl w-full mx-auto rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="w-full max-h-[60vh] aspect-video">
              <ThreeScene height="100%" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="py-32 relative overflow-hidden"
        id="features"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        </div>

        <div className="container-padding relative z-10">
          <motion.h2
            variants={fadeIn}
            className="text-center text-4xl font-bold mb-4 gradient-text"
          >
            Why Choose Vecturo?
          </motion.h2>
          <motion.p
            variants={fadeIn}
            className="text-center text-gray-600 mb-16 max-w-2xl mx-auto"
          >
            Experience a Smarter Way to Share Rides With Features Designed For
            Your Convenience
          </motion.p>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <FiUsers className="w-8 h-8" />,
                title: "Smart Matching",
                description: "Find Rideshare Partners Effortlessly",
              },
              {
                icon: <FiDollarSign className="w-8 h-8" />,
                title: "Cost Efficiency",
                description: "Share Rides and Split Costs for Maximum Savings",
              },
              {
                icon: <FiShield className="w-8 h-8" />,
                title: "Secure and Reliable",
                description: "Authenticated Users Ensure a Trusted Community",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="card hover:shadow-xl transition-all duration-300 p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-6 mx-auto text-primary-600 shadow-inner">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-32">
            <motion.h2
              variants={fadeIn}
              className="text-center text-4xl font-bold mb-4 gradient-text"
            >
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeIn}
              className="text-center text-gray-600 mb-16 max-w-2xl mx-auto"
            >
              Get started with Vecturo in three simple steps
            </motion.p>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  step: 1,
                  title: "Set Your Route",
                  description: "Input Your Starting Point and Destination",
                },
                {
                  step: 2,
                  title: "Get Matched",
                  description:
                    "Get Matched With a Ride Partner Traveling the Same Way",
                },
                {
                  step: 3,
                  title: "Share & Save",
                  description: "Share the Ride and Enjoy the Savings",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeIn}
                  className="card hover:shadow-xl transition-all duration-300 p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 hover:bg-white text-center"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-6 mx-auto text-white font-bold text-xl">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </MainLayout>
  );
};

export default Homepage;

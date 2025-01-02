const User = require("../models/User");

const createOrUpdateUser = async (req, res) => {
  try {
    const { uid, email, displayName, phoneNumber } = req.body;

    // Check if user exists
    let user = await User.findOne({ uid });

    if (user) {
      // Update existing user
      user = await User.findOneAndUpdate(
        { uid },
        {
          email,
          fullName: displayName,
          phoneNumber: phoneNumber || "",
        },
        { new: true }
      );
    } else {
      // Create new user
      user = new User({
        uid,
        email,
        fullName: displayName,
        phoneNumber: phoneNumber || "",
      });
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in createOrUpdateUser:", error);
    res.status(500).json({ error: "Error creating/updating user" });
  }
};

const getUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const user = await User.findOne({ uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUser:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
};

module.exports = {
  createOrUpdateUser,
  getUser,
};

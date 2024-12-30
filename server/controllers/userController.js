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
        university: "", // This can be updated later in profile
      });
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in createOrUpdateUser:", error);
    res.status(500).json({ error: "Error creating/updating user" });
  }
};

module.exports = {
  createOrUpdateUser,
};

const User = require("../models/user");
const bcrypt = require("bcryptjs");

module.exports = {
  createUser: async function ({ userInput }, req) {
    let existingUser;

    try {
      const existingUser = await User.find({ email: userInput.email });
    } catch (err) {
      const error = new Error("Failed to find user");
      throw error;
    }

    if (existingUser) {
      const error = new Error("User exists already!");
      throw error;
    }

    let hashedPassword;

    try {
      hashedPassword = await bcrypt.hash(userInput.password, 12);
    } catch (err) {
      const error = new Error("Failed to encrypt password");
      throw error;
    }

    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword,
    });

    let createdUser;

    try {
      createdUser = await user.save();
    } catch (err) {
      const error = new Error("Failed to save user");
      throw error;
    }

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
};

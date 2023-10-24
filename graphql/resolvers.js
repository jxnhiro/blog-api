const User = require("../models/user");
const Post = require("../models/post");

const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = {
  createUser: async function ({ userInput }, req) {
    let existingUser;
    const errors = [];

    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Email is invalid." });
    }

    if (validator.isLength(userInput.password, { min: 5 })) {
      errors.push({ message: "Password is too short." });
    }

    if (errors.length > 0) {
      const error = new Error("Input is invalid");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    try {
      existingUser = await User.find({ email: userInput.email });
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
  login: async function ({ email, password }, req) {
    const user = await User.findOne({ email: email });

    if (!user) {
      const error = new Error("User not found.");
      error.code = 404;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error("Password is incorrect.");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    return { token: token, userId: user._id.toString() };
  },
  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not authenticated");
      error.code = 401;
      throw error;
    }

    const errors = [];

    if (!validator.isLength(postInput.title, { min: 5 })) {
      errors.push({ message: "Title is invalid" });
    }

    if (!validator.isLength(postInput.content, { min: 5 })) {
      errors.push({ message: "Content is invalid" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;

      throw error;
    }

    const user = User.findById(req.userId);

    if (!user) {
      const error = new Error("Invalid user.");
      error.code = 401;
      throw error;
    }

    console.log("User", user._id);

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user._id,
    });

    let createdPost;

    try {
      createdPost = await post.save();
    } catch (err) {
      const error = new Error("Failed to save post");
      throw error;
    }

    user.posts.push(createdPost);

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
};

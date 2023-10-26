const User = require("../models/user");
const Post = require("../models/post");

const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
const utilities = require("../utilities/utilities");

module.exports = {
  createUser: async function ({ userInput }, req) {
    let existingUser;
    const errors = [];

    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Email is invalid." });
    }

    if (!validator.isLength(userInput.password, { min: 5 })) {
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

    if (existingUser.length > 0) {
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

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("Invalid user.");
      error.code = 401;
      throw error;
    }

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });

    let createdPost;

    try {
      createdPost = await post.save();
    } catch (err) {
      const error = new Error("Failed to create post");
      error.code = 500;
      throw error;
    }

    user.posts.push(createdPost);

    try {
      await user.save();
    } catch (err) {
      const error = new Error("Failed to save user");
      error.code = 500;
      throw error;
    }

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("Authentication failed");
      error.code = 403;
      throw error;
    }

    if (!page) {
      page = 1;
    }

    const perPage = 2;

    let posts;

    try {
      posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate("creator");
    } catch (err) {
      const error = new Error("Internal server error.");
      error.code = 500;
      throw error;
    }

    let totalPost;

    try {
      totalPost = await Post.find().countDocuments();
    } catch (err) {
      const error = new Error("Cannot count documents");
      error.code = 500;
      throw error;
    }

    return {
      posts: posts.map((p) => {
        return {
          ...p._doc,
          _id: p._id.toString(),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        };
      }),
      totalPost: totalPost,
    };
  },
  post: async function ({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error("Authorization forbidden");
      error.code = 403;
      throw error;
    }

    let post;

    try {
      post = await Post.findById(postId).populate("creator");
    } catch (err) {
      const error = new Error("Could not find a post with that ID");
      error.code = 404;
      throw error;
    }

    return { ...post._doc, createdAt: post.createdAt.toISOString() };
  },
  updatePost: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error("Forbidden authorization");
      error.code = 403;
      throw error;
    }

    const data = args.updateInput;

    let post;

    try {
      post = await Post.findById(data.postId).populate("creator");
    } catch (err) {
      const error = new Error("Post not found.");
      error.code = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Forbidden authorization");
      error.code = 403;
      throw error;
    }

    const errors = [];

    if (!validator.isLength(data.title, { min: 5 })) {
      errors.push({ message: "Title is invalid" });
    }

    if (!validator.isLength(data.content, { min: 5 })) {
      errors.push({ message: "Content is invalid" });
    }

    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;

      throw error;
    }

    post.title = data.title;
    post.content = data.content;

    if (data.imageUrl !== "undefined") {
      post.imageUrl = data.imageUrl;
    }

    let savedPost;

    try {
      savedPost = await post.save();
    } catch (err) {
      const error = new Error("Failed to save post");
      error.code = 500;
      throw error;
    }

    return { ...savedPost._doc, createdAt: post.updatedAt.toISOString() };
  },
  deletePost: async function ({ postId }, req) {
    if (!req.isAuth) {
      const error = new Error("Forbidden authorization");
      error.code = 403;
      throw error;
    }

    let post;

    try {
      post = await Post.findById(postId);
    } catch (err) {
      const error = new Error("Cannot find post");
      error.code = 404;
      throw error;
    }

    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("Forbidden authorization");
      error.code = 403;
      throw error;
    }

    let deletePost;

    try {
      utilities.clearImage(post.imageUrl);
    } catch (err) {
      throw err;
    }

    try {
      deletePost = await Post.findByIdAndDelete(postId);
    } catch (err) {
      return false;
    }

    return true;
  },
  status: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error("Forbidden authorization");
      error.code = 403;
      throw error;
    }

    let user;

    try {
      user = await User.findById(req.userId);
    } catch (err) {
      const error = new Error("Cannot find user");
      error.code = 403;
      throw error;
    }

    return user.status;
  },
  updateStatus: async function ({ status }, req) {
    if (!req.isAuth) {
      const error = new Error("Forbidden authorization");
      error.code = 403;
      throw error;
    }

    let user;

    try {
      user = await User.findById(req.userId);
    } catch (err) {
      const error = new Error("Cannot find user");
      error.code = 403;
      throw error;
    }

    user.status = status;

    try {
      await user.save();
    } catch (err) {
      const error = new Error("Failed to save user");
      error.code = 500;
      throw error;
    }

    return true;
  },
};

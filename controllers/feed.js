const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");

const utilities = require("../utilities/utilities");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  const skipIncrement = (currentPage - 1) * perPage;

  let totalItems;
  let posts;

  try {
    totalItems = await Post.find().countDocuments();
  } catch (err) {
    const error = new Error("Cannot count documents.");
    error.statusCode = 404;
    return next(error);
  }

  try {
    posts = await Post.find().skip(skipIncrement).limit(perPage);
  } catch (err) {
    utilities.checkForStatusCode(err);
    return next(err);
  }

  res.status(200).json({
    message: "Posts are fetched successfully",
    posts: posts,
    totalItems: totalItems,
  });
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Entered data has the incorrect format.");
    error.statusCode = 422;
    return next(error);
  }

  if (!req.file) {
    const error = new Error("No image is found.");
    error.statusCode = 422;
    return next(error);
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace("\\", "/");
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });

  let user;

  try {
    await post.save();
  } catch (err) {
    const error = new Error("Cannot save post");
    error.statusCode = 400;
    return next(error);
  }

  try {
    user = await User.findById(req.userId);
  } catch (err) {
    const error = new Error("Cannot find User ID");
    error.statusCode = 404;
    return next(error);
  }

  try {
    user.posts.push(post);
    await user.save();
  } catch (err) {
    const error = new Error("Cannot save user changes");
    error.statusCode = 400;
    return next(error);
  }

  res.status(201).json({
    message: "Post created successfully!",
    post: post,
    creator: { _id: user._id, name: user.name },
  });
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;

  let post;

  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new Error("Internal server error.");
    error.statusCode = 500;
    return next(error);
  }

  if (!post) {
    const error = new Error("Cannot find post");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    message: "Post Successfully Fetched",
    post: post,
  });
};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Entered data has the incorrect format.");
    error.statusCode = 422;
    return next(error);
  }

  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;

  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = Error("No File Picked");
    error.statusCode = 422;
    return next(error);
  }

  let post;

  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new Error("Internal server error.");
    error.statusCode = 500;
    return next(error);
  }

  if (!post) {
    const error = new Error("There is no post with that ID.");
    error.statusCode = 404;
    return next(error);
  }

  if (post.creator.toString() !== req.userId) {
    const error = new Error("User has no permission to update post.");
    error.statusCode = 403;
    return next(error);
  }

  if (imageUrl !== post.imageUrl) {
    utilities.clearImage(post.imageUrl);
  }

  try {
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    await post.save();
  } catch (err) {
    const error = new Error("Failed to save post.");
    error.statusCode = 400;
    return next(error);
  }

  res.status(200).json({
    message: `Post with ID ${postId} is successfully updated!`,
    post: post,
  });
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  let post;

  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new Error("Post not found.");
    error.statusCode = 404;
    return next(error);
  }

  if (post.creator.toString() !== req.userId) {
    const error = new Error("User is not authorized to delete post.");
    error.statusCode = 403;
    return next(error);
  }

  utilities.clearImage(post.imageUrl);

  try {
    await Post.findByIdAndDelete(postId);
  } catch (err) {
    const error = new Error("Internal server error");
    error.statusCode = 500;
    return next(error);
  }

  let user;

  try {
    user = await User.findById(req.userId);
  } catch (err) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    return next(error);
  }

  user.posts.pull(postId);

  try {
    await user.save();
  } catch (err) {
    const error = new Error("Failed to save user after removing post.");
    error.statusCode = 400;
    return next(error);
  }

  res.status(200).json({
    message: `Successfully deleted post of ${postId}`,
  });
};

exports.getStatus = async (req, res, next) => {
  if (!req.userId) {
    const error = new Error("User is not authorized");
    error.statusCode = 403;
    return next(error);
  }

  let user;

  try {
    user = await User.findById(req.userId);
  } catch (err) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    return next(error);
  }

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    return next(error);
  }

  res.status(200).json({
    message: "Successfully fetched status",
    status: user.status || "User has set no status yet",
  });
};

exports.updateStatus = async (req, res, next) => {
  if (!req.userId) {
    const error = new Error("User is not authorized");
    error.statusCode = 403;
    throw err;
  }

  const status = req.body.status;

  let user;

  try {
    user = await User.findById(req.userId);
  } catch (err) {
    const error = new Error("Internal server error");
    error.statusCode = 500;
    throw error;
  }

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    return next(error);
  }

  user.status = status;

  try {
    await user.save();
  } catch (err) {
    const error = new Error("Failed to save user");
    error.statusCode = 400;
    return next(error);
  }
  res.status(201).json({
    message: "Successfully updated status",
    status: status,
  });
};

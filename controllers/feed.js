const { validationResult } = require("express-validator");

const Post = require("../models/post");
const utilities = require("../utilities/utilities");

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  const skipIncrement = (currentPage - 1) * perPage;

  let totalItems;

  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;

      return Post.find().skip(skipIncrement).limit(perPage);
    })
    .then((posts) => {
      res.status(200).json({
        message: "Posts fetched successfully",
        posts: posts,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      utilities.checkForStatusCode(err);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Entered data has the incorrect format.");
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error("No image is found.");
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  const imageUrl = req.file.path.replace("\\", "/");
  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: {
      name: "Maximillian",
    },
  });

  post
    .save()
    .then((result) => {
      console.log("Post Result: ", result);
      res.status(201).json({
        message: "Post created successfully!",
        post: result,
      });
    })
    .catch((err) => {
      utilities.checkForStatusCode(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("There is no post with that ID.");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: "Post Successfully Fetched",
        post: post,
      });
    })
    .catch((err) => {
      utilities.checkForStatusCode(err);
    });
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Entered data has the incorrect format.");
    error.statusCode = 422;
    throw error;
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
    throw error;
  }

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("There is no post with that ID.");
        error.statusCode = 404;
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        utilities.clearImage(post.imageUrl);
      }

      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;

      return post.save();
    })
    .then((result) => {
      res.status(200).json({
        message: `Post with ID ${postId} is successfully updated!`,
        post: result,
      });
    })
    .catch((err) => {
      utilities.checkForStatusCode(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Post not found.");
        error.statusCode = 404;
        throw error;
      }

      //TODO: Check for logged in user.

      utilities.clearImage(post.imageUrl);

      return Post.findByIdAndRemove(postId);
    })
    .then((result) => {
      console.log(result);

      res.status(200).json({
        message: "Successfully deleted post",
        descrption: result,
      });
    })
    .catch((err) => {
      utilities.checkForStatusCode(err);
    });
};

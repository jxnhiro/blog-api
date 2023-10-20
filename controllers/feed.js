const { validationResult } = require("express-validator");

const Post = require("../models/post");
const utilities = require("../utilities/utilities");

exports.getPosts = (req, res, next) => {
  Post.find()
    .then((posts) => {
      res.status(200).json({
        message: "Posts fetched successfully",
        posts: posts,
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

  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title,
    content: content,
    imageUrl: "images/duck.jpg",
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
  console.log(`Post ID: ${postId}`);

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

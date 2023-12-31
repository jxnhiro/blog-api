const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const isAuth = require("../middlewares/is-auth");
const feedController = require("../controllers/feed");

router.get("/posts", isAuth, feedController.getPosts);

router.get("/post/:postId", isAuth, feedController.getPost);

router.put(
  "/post/:postId",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.updatePost,
);

router.post(
  "/post",
  isAuth,
  [
    body("title").trim().isLength({ min: 5 }),
    body("content").trim().isLength({ min: 5 }),
  ],
  feedController.createPost,
);

router.delete("/post/:postId", isAuth, feedController.deletePost);

router.get("/status", isAuth, feedController.getStatus);

router.patch("/status", isAuth, feedController.updateStatus);

module.exports = router;

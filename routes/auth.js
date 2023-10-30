const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const User = require("../models/user");
const authController = require("../controllers/auth");
const isAuth = require("../middlewares/is-auth");

router.post(
  "/signup",
  [
    body("email").isEmail().withMessage("Please enter a valid email"),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().isLength({ min: 1 }),
  ],
  authController.createUser,
);

router.post(
  "/login",
  [body("email").isEmail().withMessage("Please enter a valid email")],
  authController.logIn,
);

module.exports = router;

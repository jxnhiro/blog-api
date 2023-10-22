const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();

const User = require("../models/user");
const utilities = require("../utilities/utilities");

const JWT_SECRET = process.env.JWT_SECRET;

exports.createUser = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("User criteria validation failed.");
    error.statusCode = 422;
    throw error;
  }

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new Error("Failed to encrypt password");
    error.statusCode = 400;
    return next(error);
  }

  const user = new User({
    email: email,
    password: hashedPassword,
    name: name,
  });

  try {
    await user.save();
  } catch (err) {
    const error = new Error("Failed to save user");
    error.statusCode = 400;
    return next(error);
  }

  res.status(201).json({
    message: `User of ID: ${user._id} successfully created`,
  });
};

exports.logIn = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  let user;

  try {
    user = await User.findOne({ email: email });
  } catch (err) {
    const error = new Error("Failed to find user with the email.");
    error.statusCode = 404;
    return next(error);
  }

  if (!user) {
    const error = new Error("User could not be found");
    error.statusCode = 404;
    return next(error);
  }

  try {
    await bcrypt.compare(password, user.password);
  } catch (err) {
    const error = new Error("Wrong password");
    error.statusCode = 401;
    return next(error);
  }

  const token = jwt.sign(
    {
      email: user.email,
      userId: user._id.toString(),
    },
    JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );

  res.status(200).json({
    message: "Successfully logged in",
    userId: user._id.toString(),
    token: token,
  });
};

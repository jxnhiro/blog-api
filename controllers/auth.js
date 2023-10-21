const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();

const User = require("../models/user");
const utilities = require("../utilities/utilities");

const JWT_SECRET = process.env.JWT_SECRET;

exports.createUser = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("User criteria validation failed.");
    error.statusCode = 422;
    throw error;
  }

  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        email: email,
        password: hashedPassword,
        name: name,
      });

      return user.save();
    })
    .then((result) => {
      res.status(201).json({
        message: `User of ID: ${result._id} successfully created`,
      });
    })
    .catch((err) => {
      utilities.checkForStatusCode(err);
    });
};

exports.logIn = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  let loadedUser;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("User could not be found");
        error.statusCode = 404;
        throw error;
      }

      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Password is incorrect");
        error.statusCode = 401;
        throw error;
      }

      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        JWT_SECRET,
        {
          expiresIn: "1h",
        },
      );

      res.status(200).json({
        message: "Successfully logged in",
        userId: loadedUser._id.toString(),
        token: token,
      });
    })
    .catch((err) => {
      utilities.checkForStatusCode(err);
    });
};

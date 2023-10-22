const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const env = require("dotenv").config();
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

const { watch } = require("./models/post");
const utilities = require("./utilities/utilities");

const MONGO_URL = process.env.MONGODB_URI;

const app = express();

app.use("/images", express.static(path.join(__dirname, "images")));

app.use(cors());
app.use(bodyParser.json());
app.use(
  multer({
    storage: utilities.fileStorage,
    fileFilter: utilities.fileFilter,
  }).single("image"),
);
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((error, req, res, next) => {
  console.log(`${error}`);

  const statusCode = error.statusCode || 500;
  const message = error.message;

  res.status(statusCode).json({
    message: `Error ${statusCode}`,
    description: message,
  });
});

mongoose
  .connect(MONGO_URL)
  .then(() => {
    const server = app.listen(8080);
    const io = require("./socket").init(server);

    io.on("connection", (socket) => {
      console.log("Client connected.");
    });

    console.log("Connected to MongoDB Database");
  })
  .catch((err) => {
    console.log("Error Found in App.JS: ", err);
  });

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const env = require("dotenv").config();
const cors = require("cors");
const path = require("path");

const feedRoutes = require("./routes/feed");
const { watch } = require("./models/post");
const MONGO_URL = process.env.MONGODB_URI;
const app = express();

app.use("/images", express.static(path.join(__dirname, "images")));

app.use(cors());
app.use(bodyParser.json());

app.use("/feed", feedRoutes);

app.use((error, req, res, next) => {
  console.log(`Error: ${error}`);

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
    app.listen(8080);
    console.log("Connected to MongoDB Database");
  })
  .catch((err) => {
    console.log("Error Found in App.JS: ", err);
  });

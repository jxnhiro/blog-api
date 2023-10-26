const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const env = require("dotenv").config();
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");

const utilities = require("./utilities/utilities");

const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middlewares/auth");

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

app.use(auth);

app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    const error = new Error("Not authenticated");
    error.statusCode = 403;
    throw error;
  }

  if (!req.file) {
    return res.status(200).json({
      message: "No file provided",
    });
  }

  console.log("Old path", req.body.oldPath);

  if (req.body.oldPath !== "undefined") {
    utilities.clearImage(req.body.oldPath);
  }

  console.log("New path", req.file.path);

  return res.status(201).json({
    message: "File stored",
    filePath: req.file.path,
  });
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }

      const data = err.originalError.data;
      const message = err.originalError.message || `An error occured.`;
      const code = err.originalError.code || 500;

      return { message: message, status: code, data: data };
    },
  }),
);

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
    app.listen(8080);
    console.log("Connected to MongoDB Database");
  })
  .catch((err) => {
    console.log("Error Found in App.JS: ", err);
  });

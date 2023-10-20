const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

exports.checkForStatusCode = (err) => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }

  next(err);
};

exports.fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}.jpg`);
  },
});

exports.fileFilter = (req, file, cb) => {
  if (
    file.mimetype == "image/png" ||
    file.mimetype == "image/jpg" ||
    file.mimetype == "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

exports.clearImage = (filePath) => {
  const modifiedFilePath = path.join(__dirname, "..", filePath);

  fs.unlink(modifiedFilePath, (err) => {
    if (err) {
      const error = new Error("Cannot delete image, as image is not found");
      error.statusCode = 404;
      throw error;
    }
  });
};

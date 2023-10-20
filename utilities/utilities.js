exports.checkForStatusCode = (err) => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }

  next(err);
};

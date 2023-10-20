exports.getPosts = (req, res, next) => {
  res.status(200).json({
    title: "This is your first content",
    content: "This is your content"
  });
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;

  res.status(201).json({
    message: "Successfully created title!",
    title: title,
    content: content
  });
};

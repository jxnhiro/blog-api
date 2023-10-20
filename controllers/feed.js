const { validationResult } = require('express-validator');

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: '1',
        title: 'This is your first content',
        content: 'This is your content',
        imageUrl: 'images/duck.jpg',
        creator: {
          name: 'Maximillian',
        },
        createdAt: new Date(),
      }
    ]
  });
};

exports.createPost = (req, res, next) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed!',
      description: 'Entered data has the incorrect format.',
      errors: errors.array()
    });
  }

  const title = req.body.title;
  const content = req.body.content;

  res.status(201).json({
    message: 'Post created successfully!',
    post: {
      _id: new Date().toISOString(),
      title: title,
      content: content,
      creator: {
        name: 'Maximillian'
      },
      createdAt: new Date(),
    }
  });
};

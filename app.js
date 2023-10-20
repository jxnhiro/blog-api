const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const env = require('dotenv').config();
const cors = require('cors');

const feedRoutes = require('./routes/feed');
const MONGO_URL = process.env.MONGODB_URI;
const app = express();

app.use(bodyParser.json());

app.use(cors());

app.use('/feed', feedRoutes);

mongoose
  .connect(MONGO_URL)
  .then(() => {
    app.listen(8080);
    console.log('Connected to MongoDB Database');
  })
  .catch((err) => {
    console.log('Error Found in App.JS: ', err);
  });

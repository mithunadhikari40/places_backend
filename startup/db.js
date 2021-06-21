const winston = require('winston');
const mongoose = require('mongoose');

//server

//localhost

module.exports = function() {
  mongoose.connect('mongodb://localhost:27017/places', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false 
  })
    .then(() => winston.info('Connected to MongoDB...'));
}
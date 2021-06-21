const winston = require('winston');
const mongoose = require('mongoose');

//server

module.exports = function() {
  mongoose.connect('mongodb+srv://mithun:mithun@cluster0.r3i7g.mongodb.net/places', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false 
  })
    .then(() => winston.info('Connected to MongoDB...'));
}

//localhost

// module.exports = function() {
//   mongoose.connect('mongodb://localhost:27017/places', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false 
//   })
//     .then(() => winston.info('Connected to MongoDB...'));
// }
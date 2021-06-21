const winston = require('winston');
const mongoose = require('mongoose');

//server
module.exports = function() {
  mongoose.connect('mongodb://frescoUser:frescoPassword@localhost:27017/fresco', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false 
  })
    .then(() => winston.info('Connected to MongoDB...'));
}
//localhost

// module.exports = function() {
//   mongoose.connect('mongodb://localhost:27017/fresco', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useFindAndModify: false 
//   })
//     .then(() => winston.info('Connected to MongoDB...'));
// }
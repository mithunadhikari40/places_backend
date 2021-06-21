const config = require('config');
require('dotenv').config();


module.exports = function() {
var port =  process.env.PORT;
  var key = process.env.JWT_PRIVATE_KEY || "places_2021_broadway";
  console.log('Private key',key,port);

   if (!key) {
    throw new Error('FATAL ERROR: jwtPrivateKey is not defined.');
  }
}
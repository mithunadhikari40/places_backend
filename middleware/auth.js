const jwt = require('jsonwebtoken');
const config = require('config');
require('dotenv').config();


module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) return res.status(403).json({ error: 'Access denied. No token provided.' });
  var dateNow = new Date();

  jwt.verify(token, process.env.JWT_PRIVATE_KEY || "places_2021_broadway", function (err, decoded) {
    if (err) {
      return res.status(401).json({ error: err });

    }
    console.log("The decoded item is ", decoded);
    if (decoded.exp < dateNow.getTime() / 1000) {
      return res.status(401).json({ error: 'Token expired, please login in again.' });

    }

    req.user = decoded;
    next();

  });


}
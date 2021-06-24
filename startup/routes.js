const express = require('express');
const users = require('../routes/users');
const auth = require('../routes/auth');
const savedAddress = require('../routes/user_saved_places');
const notificaion = require('../routes/notification');
const favorite = require('../routes/favorite_route');



const error = require('../middleware/error');

module.exports = function(app) {
  app.use(express.json());
  app.use('/api/users', users);
  app.use('/api/auth', auth);

  app.use('/api/notification', notificaion);
  app.use('/api/places', savedAddress);
  app.use('/api/favorite', favorite);



  app.use(error);
}
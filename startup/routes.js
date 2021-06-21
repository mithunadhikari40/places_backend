const express = require('express');
const users = require('../routes/users');
const auth = require('../routes/auth');
const city = require('../routes/city_route');
const config = require('../routes/config_route');
const product= require('../routes/products_route');
const savedAddress = require('../routes/user_saved_address_route');
const invoice = require('../routes/invoice');
const cart = require('../routes/cart');
const transaction = require('../routes/transaction');
const notificaion = require('../routes/notification');
const category = require('../routes/category_route');
const cuttingMethod = require('../routes/cutting_method_route');
const packingMethod = require('../routes/packing_method_route');
const albums = require('../routes/albums_route');


const error = require('../middleware/error');

module.exports = function(app) {
  app.use(express.json());
  app.use('/api/users', users);
  app.use('/api/auth', auth);
  app.use('/api/city', city);
  app.use('/api/config', config);
  app.use('/api/notification', notificaion);
  app.use('/api/product', product);
  app.use('/api/address', savedAddress);
  app.use('/api/invoice', invoice);
  app.use('/api/cart', cart);
  app.use('/api/transaction', transaction);
  app.use('/api/category', category);
  app.use('/api/cutting_method', cuttingMethod);
  app.use('/api/packing_method', packingMethod);
  app.use('/api/albums', albums);


  app.use(error);
}
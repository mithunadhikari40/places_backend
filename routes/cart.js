const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');
const moment = require('moment');
//validation for the request
const { body, validationResult } = require('express-validator');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { User } = require('../models/user');
const randomMC = require("random-material-color");
const { Parser, transforms: { unwind } } = require('json2csv');
const fs = require("fs");
const { validateOrder, Order } = require('../models/order');
const { validateCart, Cart } = require('../models/cart');
const { Product } = require('../models/products');
const router = express.Router();


router.get('/', auth, async (req, res) => {
  const user = req.user;
  let cart;
  if (req.user.isAdmin) {
    cart = await Cart.find().populate('orders').populate('product')
      //.populate('orders.category')
      .populate({
        path: 'orders',
        populate: { path: 'category' }
      })
      .populate('user').sort('date');

  } else {
    cart = await Cart.find({ user: user._id }).populate('orders').populate('product')
      //.populate('orders.category')
      .populate({
        path: 'orders',
        populate: { path: 'category' }
      })
      .populate('user').sort('date');

  }
  res.json(cart);
});
router.get('/top6', [auth, admin], async (req, res) => {
  const cart = await Cart.find().populate('orders')
    .populate({
      path: 'orders',
      populate: { path: 'category' }
    })
    .populate('user').limit(6).sort('date');
  res.json(cart);
});


router.get('/cart', auth, async (req, res) => {
  const user = req.user;
  let _cart;
  if (req.user.isAdmin) {
    _cart = await Cart.find()
      //.populate('orders.category')
      .populate({
        path: 'orders',
        populate: { path: 'category' }
      })
      .populate('user').populate('product').sort('date');

  } else {
    _cart = await Cart.find({ user: user._id })
      //.populate('orders.category')
      .populate({
        path: 'orders',
        populate: { path: 'category' }
      })
      .populate('user')
      .populate('product').sort('date');

  }

  //   let _cart = await Cart.find().populate('orders')
  //   .populate({ 
  //     path: 'orders',
  //     populate: { path: 'category' }
  // })
  //   .populate('user').sort('date');



  const orders = [];
  if (!_cart) return res.json(orders);
  if (!Array.isArray(_cart)) {
    _cart = [_cart];
  }

  for (const item of _cart) {
    if (item && item.orders && Array.isArray(item.orders)) {
      for (const product of item.orders) {
        const orderObject = {
          orderRef: item._id,
          category: item.category,
          productRef: product._id,
          customer: item.user.name,
          date: item.date,
          orderDate: product.createdAt,
          productName: product.name,
          quantity: product.quantity,
          price: product.price,
          status: item.status,
          address: item.address,
          unit: product.unit,
          packingMethod: product.packingMethod,
          cuttingMethod: product.cuttingMethod,
          total: (product.price * product.quantity),
          orderTotal: item.total,
          specialNote: product.specialNote,
          specialInstruction: item.specialInstruction,
          orderTax: item.tax,
          serviceCharge: item.serviceCharge,
          paymentMethod: item.paymentMethod,
          size: product.size,
          product: item.product,
        };
        orders.push(orderObject);
      }
    }
  }
  res.json(orders);
});


router.post('/', auth, async (req, res) => {
  const { error } = validateCart(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  let user = await User.findById(req.user._id);
  if (!user) return res.status(400).json({ error: 'User Not found' });

  let product = await Product.findById(req.body.product);
  if (!product) return res.status(400).json({ error: 'Product Not found' });

  //here we are validating each and every orders inside the request
  const orders = req.body.orders;
  const isArray = Array.isArray(orders);
  if (!isArray) return res.status(400).json({ error: 'Order should be a list' });

  if (orders.length < 1) {
    return res.status(400).json({ error: 'Order list is not provided' });

  }

  for (const singleOrder of orders) {
    const { error } = validateOrder(singleOrder);
    if (error) return res.status(400).json({ error: error.details[0].message });
  }

  let savedOrderList = [];
  for (const singleOrder of orders) {
    const latestObject = await Order.find({}).sort({ _id: -1 }).limit(1);
    let latestCount = 1;
    if (latestObject && latestObject.length > 0) {
      latestCount = latestObject[0].sequence + 1;
    }
    singleOrder.sequence = latestCount;

    singleOrder.user = user;

    let temp = new Order(singleOrder);
    temp = await temp.save();
    savedOrderList.push(temp);
  }

  let _cart = _.pick(req.body, ['subTotal', 'total', 'tax', 'extraPrice',
    'serviceCharge', 'status', 'specialInstruction']);
  const latestObject = await Cart.find({}).sort({ _id: -1 }).limit(1);
  let latestCount = 1;
  if (latestObject && latestObject.length > 0) {
    latestCount = latestObject[0].sequence + 1;
  }
  _cart.sequence = latestCount;

  _cart.user = user;
  _cart.product = product;
  _cart.date = Date();
  _cart.orders = savedOrderList;
  _cart = new Cart(_cart);
  _cart = await _cart.save();

  let result = _.pick(_cart, ['subTotal', 'total', 'tax', 'serviceCharge', 'extraPrice', 'product',
    'orders', 'user', 'date', 'specialInstruction']);

  res.json({ result });
});

router.post('/deleteMultiple', [auth], async (req, res) => {
  const user = req.user;
  let ids = [];
  if (!Array.isArray(req.body.id)) {
    ids = req.body.id.split(",");
  } else {
    ids = req.body.id;
  }
  if (!Array.isArray(ids)) {
    return res.status(404).json({ error: 'Id should be an array.' });
  }
  const list = await Cart.find({ _id: { $in: ids } });
  for (const item of list) {
    if (item.user.toString() !== user._id.toString()) {
      return res.status(400).json({ error: "You are not authorized to delete this document" });
    }
  }
  const cart = await Cart.deleteMany({ _id: { $in: ids } });

  if (!cart) return res.status(404).json({ error: 'The carts with the given IDS were not found.' });

  res.json(cart);
});


router.delete('/:id', auth, async (req, res) => {
  const user = req.user;

  const _kart = await Cart.findById(req.params.id);

  if (_kart.user.toString() !== user._id.toString()) {
    return res.status(400).json({ error: "You are not authorized to delete this document" });
  }
  const _cart = await Cart.findByIdAndRemove(req.params.id);


  if (!_cart) return res.status(404).json({ error: 'The cart with the given ID was not found.' });

  res.json(_cart);
});

router.put('/updateCart', [auth], async (req, res) => {

  if (!req.body.cartId) return res.status(400).json({ error: "Invalid cart Id" });
  if (!req.body.orderId) return res.status(400).json({ error: "Invalid order Id" });
  if (!req.body.quantity) return res.status(400).json({ error: "Invalid quantity" });
  if (!req.body.subTotal) return res.status(400).json({ error: "Invalid sub total" });
  if (!req.body.total) return res.status(400).json({ error: "Invalid total" });
  if (!req.body.tax) return res.status(400).json({ error: "Invalid tax" });
  if (req.body.serviceCharge == undefined || req.body.serviceCharge == null) return res.status(400).json({ error: "Invalid service charge" });

  const cartId = req.body.cartId;
  const orderId = req.body.orderId;

  // check to see if there is any order with the given id and associated with the current user
  const user = req.user;
  const _oddr = await Order.findById(orderId);

  if (_oddr.user.toString() !== user._id.toString()) {
    return res.status(400).json({ error: "You are not authorized to edit this document" });
  }

  const _kart = await Cart.findById(cartId);

  if (_kart.user.toString() !== user._id.toString()) {
    return res.status(400).json({ error: "You are not authorized to edit this document" });
  }



  const updateOrder = await Order.findByIdAndUpdate(orderId, { quantity: req.body.quantity }, { new: true });

  if (!updateOrder) return res.status(404).json({ error: 'The order with the given Id does not exists.' });

  const updateCart = await Cart.findByIdAndUpdate(cartId, {
    subTotal: req.body.subTotal,
    total: req.body.total,
    tax: req.body.tax,
    serviceCharge: req.body.serviceCharge,
    updatedDate: Date.now()

  }, { new: true });

  if (!updateCart) return res.status(404).json({ error: 'The order with the given Id does not exists.' });



  res.json(updateCart);
});

router.get('/:id', auth, async (req, res) => {

  const _cart = await Cart.findById(req.params.id).populate('orders').populate('product')
    .populate('user')
    // .populate('orders.category')
    .populate({
      path: 'orders',
      populate: { path: 'category' }
    })
    .sort('date');

  if (!_cart) return res.status(404).json({ error: 'The cart with the given ID was not found.' });

  res.json({ _cart });
});


module.exports = router;
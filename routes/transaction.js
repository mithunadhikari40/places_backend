const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');

const auth = require('../middleware/auth');
const { User } = require('../models/user');
const { validateTransaction, Transaction } = require('../models/transactions');
const router = express.Router();


router.get('/', auth, async (req, res) => {
  const user = req.user;
  let cart;
  if(req.user.isAdmin){
    cart = await Transaction.find({});

  }else{
    cart = await Transaction.find({user:user._id});

  }
  res.json(cart);
});



router.post('/', auth, async (req, res) => {
  const { error } = validateTransaction(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  let user = await User.findById(req.user._id);
  if (!user) return res.status(400).json({ error: 'User Not found' });

  
  let _trans = _.pick(req.body, ['id', 'total', 'transactionNumber', 'created']);
  

  _trans.user = user;
  _trans = new Transaction(_trans);
  _trans = await _trans.save();



  res.json({ _trans });
});



module.exports = router;
const Joi = require('joi');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const { User, validateRegister, validateLogin } = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const auth = require('../middleware/auth');

const { body, validationResult } = require('express-validator');

const router = express.Router();

router.post('/login',
  body('password').isLength({ min: 4 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      user = await User.findOne({ phone: req.body.phone });
    }
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or phone.' });
    }
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password.' });

    const token = user.generateAuthToken();
    res.json({ token });
  });

router.post('/admin-login',
  async (req, res) => {
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email.' });
    }
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password.' });
    if (!user.isAdmin) {

      return res.status(400).json({ error: 'Access Denied.' });

    }

    const token = user.generateAuthToken();
    res.json({ token });
  });

  // router.post('/registerAdmin', async (req, res) => {

  //   const { error } = validateRegister(req.body);
  //   if (error) return res.status(400).json({ error: error.details[0].message });
  
  
  //   let user = await User.findOne({ email: req.body.email });
  //   if (user) return res.status(400).json({ error: 'User already registered with this email address.' });
  
  
  //   user = await User.findOne({ phone: req.body.phone });
  //   if (user) return res.status(400).json({ error: 'User already registered with this phone number.' });
  
  
  //   user = new User(_.pick(req.body, ['name', 'email', 'password', 'phone', 'city']));
  //   const salt = await bcrypt.genSalt(10);
  
  //   user.password = await bcrypt.hash(user.password, salt);
  //   user.registrationDate = Date();
  //   // return res.json({success:"Here it goes",password:user.password});
  //   user.isAdmin = true;
  
  
  //   await user.save();
  
  
  //   const token = user.generateAuthToken();
  //   res.json({ user: _.pick(user, ['_id', 'name', 'email', 'phone', 'city']), 'token': token });
  // });

router.post('/register', async (req, res) => {

  const { error } = validateRegister(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });


  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json({ error: 'User already registered with this email address.' });


  user = await User.findOne({ phone: req.body.phone });
  if (user) return res.status(400).json({ error: 'User already registered with this phone number.' });


  user = new User(_.pick(req.body, ['name', 'email', 'password', 'phone', 'city']));
  const salt = await bcrypt.genSalt(10);

  user.password = await bcrypt.hash(user.password, salt);
  user.registrationDate = Date();
  // return res.json({success:"Here it goes",password:user.password});
  user.isAdmin = false;


  await user.save();


  const token = user.generateAuthToken();
  res.json({ user: _.pick(user, ['_id', 'name', 'email', 'phone', 'city']), 'token': token });
});


router.put('/updatePassword', [auth], async (req, res) => {

  if (!req.body.password) return res.status(400).json({ error: "Password is required" });
  const pass = req.body.password;
  if (pass.length < 5) {
    return res.status(400).json({ error: "Password must be at least 5 characters long" });
  }

  const user = req.user;

  const salt = await bcrypt.genSalt(10);

  const newPassword = await bcrypt.hash(pass, salt);


  const updatedUser = await User.findByIdAndUpdate(user._id, { password: newPassword }, { new: true });

  if (!updatedUser) return res.status(404).json({ error: 'The user with the given Id does not exists.' });


  const token = updatedUser.generateAuthToken();
  res.json({ token });


});

router.put('/updateName', [auth], async (req, res) => {

  if (!req.body.name) return res.status(400).json({ error: "Name is required" });
  const name = req.body.name;
  if (name.length < 2) {
    return res.status(400).json({ error: "Name must be at least 2 characters long" });
  }

  const user = req.user;
  const updatedUser = await User.findByIdAndUpdate(user._id, { name: name }, { new: true });

  if (!updatedUser) return res.status(404).json({ error: 'The user with the given Id does not exists.' });


  res.json({ user: updatedUser });


});

router.put('/updatePhone', [auth], async (req, res) => {

  if (!req.body.phone) return res.status(400).json({ error: "Phone is required" });
  const phone = req.body.phone;
  if (phone.length < 6) {
    return res.status(400).json({ error: "Phone must be at least 6 characters long" });
  }
  let user = await User.findOne({ phone: req.body.phone });
  if (user) return res.status(400).json({ error: 'User already registered with this phone number.' });

  user = req.user;

  const updatedUser = await User.findByIdAndUpdate(user._id, { phone: phone }, { new: true });

  if (!updatedUser) return res.status(404).json({ error: 'The user with the given Id does not exists.' });


  res.json({ user: updatedUser });


});
router.put('/updateEmail', [auth], async (req, res) => {

  if (!req.body.email) return res.status(400).json({ error: "Email is required" });
  const email = req.body.email;
  if (email.length < 4) {
    return res.status(400).json({ error: "Email must be at least 4 characters long" });
  }
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json({ error: 'User already registered with this email.' });

  user = req.user;

  const updatedUser = await User.findByIdAndUpdate(user._id, { email: email }, { new: true });

  if (!updatedUser) return res.status(404).json({ error: 'The user with the given Id does not exists.' });


  res.json({ user: updatedUser });


});


module.exports = router; 

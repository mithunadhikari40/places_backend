const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcrypt');
const _ = require('lodash');
const {
  User,
  validate,
  validateRegister,
  validateEdit,
  validateChangePassword,
} = require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const json2csv = require('json2csv').parse;
const fs = require("fs");
const { body, validationResult } = require('express-validator');

const admin = require('../middleware/admin');
const router = express.Router();

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ data: user });
});

router.get('/', [auth,admin], async (req, res) => {
  // todo uncomment the commented line and comment the uncommented one
  // for getting the list of users
  // const users = await User.find().sort('name');
  const users = await User.find({ isAdmin: false }).sort('name');

  res.json(users);
});
router.get('/download', [auth, admin], async (req, res) => {
  const methods = await User.find({}).sort('name');
  const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
  const filePath = `public/uploads/files/customers-${dateTime}.csv`;
  let csv;
  user = new User(_.pick(req.body,));

  const fields = ['_id', 'name', 'email', 'phone', 'city', 'address', 'zipCode']

  try {
    csv = json2csv(methods, { fields });
  } catch (err) {
    return res.status(500).json({ err });
  }

  fs.writeFile(filePath, csv, function (err) {
    if (err) {
      return res.json(err).status(500);
    }
    else {
      setTimeout(function () {
        fs.unlink(filePath, function (err) { // delete this file after 30 seconds
          if (err) {
            console.error(err);
          }
          console.log('File has been Deleted');
        });

      }, 30000);
      res.json({ filePath });
    }
  })

});


router.post('/', async (req, res) => {
  const { error } = validateRegister(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send('User already registered.');

  user = new User(_.pick(req.body, ['name', 'email', 'password']));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const token = user.generateAuthToken();
  res.header('x-auth-token', token).send(_.pick(user, ['_id', 'name', 'email']));
});



// @route:  POST api/admin/changePassword
// @desc:  User can change the password
// @access: private
router.put(
  '/changePassword',
  auth,
  async (req, res) => {
    console.log("change")
    const { error } = validateChangePassword(req.body);

    if (error) return res.status(400).json({ error: error.details[0].message });

    const userId = req.user._id;
    const { oldPassword, password } = req.body;
    try {
      const existingUser = await User.findById(userId);

      if (existingUser) {
        bcrypt.compare(
          oldPassword,
          existingUser.password,
          async (err, isMatch) => {
            if (err) {
              return res
                .status(400)
                .json({ message: 'Cannot update User Password.' });
            }
            if (isMatch) {
              const salt = await bcrypt.genSalt(10);
              existingUser.password = await bcrypt.hash(password, salt);
              const updatedUser = await existingUser.save();
              if (updatedUser) {
                return res.json({
                  message: 'Successfully updated User Password.',
                });
              }
              return false;
            }
            return res
              .status(400)
              .json({ message: 'Old password do not match' });
          },
        );
      }
    } catch (error) {
      logger.error(error);
      console.error(error);
      return res.status(400).json({
        message: 'Unable to process.',
      });
    }
    return false;
  },
);



// @route:  POST 
// @desc:  User can change the token to get the push notifications
// @access: private
router.put(
  '/updateToken',
  auth,
  async (req, res) => {
   
    const userId = req.user._id;
    const { pushToken } = req.body;
    try {
      const existingUser = await User.findById(userId);
      existingUser.pushToken = pushToken;
      const updatedUser = await existingUser.save();
      if (updatedUser) {
        return res.json({
          message: 'Successfully updated token.',
        });
      }
      return res
        .status(400)
        .json({ message: 'Something went wrong' });
    } catch (error) {
      logger.error(error);
      console.error(error);
      return res.status(400).json({
        message: 'Unable to process.',
      });
    }
  },
);


router.put('/:id', auth, async (req, res) => {
  console.log('tha values we get is ', req.body);
  const { error } = validateEdit(req.body);

  if (error) return res.status(400).json({ error: error.details[0].message });

  const data = { name, city, phone, email, zipCode, streetAddress } = req.body;

  const user = await User.findByIdAndUpdate(req.params.id, data, {
    new: true
  });

  if (!user) return res.status(404).json({ error: 'The user with the given ID was not found.' });

  res.json(user);
});


router.delete('/deleteMultiple/:id', [auth, admin], async (req, res) => {
  let ids = [];
  if (!Array.isArray(req.params.id)) {
    ids = req.params.id.split(",");
  } else {
    ids = req.params.id;
  }
  if (!Array.isArray(ids)) {
    return res.status(404).json({ error: 'Id should be an array.' });
  }
  const users = await User.deleteMany({ _id: { $in: ids } });

  if (!users) return res.status(404).json({ error: 'The users with the given IDS were not found.' });

  res.json(users);
});

module.exports = router; 

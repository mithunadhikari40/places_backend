const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');
const _ = require('lodash');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true
  },
  phone: {
    type: Number,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024
  },
  registrationDate:{
    type: Date,
    default: Date.now
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  pushToken: {
    type: String
  },
  
});

userSchema.methods.generateAuthToken = function() { 
  console.log("id is ",this._id, "and admin is ",this.isAdmin);
  const token = jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, process.env.JWT_PRIVATE_KEY || "places_2021_broadway",
    
    { expiresIn: "7d" }
    // { expiresIn: "300s" }
    );
  return token;
}

const User = mongoose.model('User', userSchema);

function validateRegister(user) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    phone: Joi.number().required()
    });

  return schema.validate(user);
}

function validateEdit(user) {
  const requiredUserModel = _.pick(user, ["name", "email", "phone", "city"]);
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    phone: Joi.number().required()
    // address: Joi.string().min(5).max(255).required(),
    // zipCode: Joi.number().required(),
  });

  return schema.validate(requiredUserModel);
}

function validateChangePassword(user) {
  const requiredUserModel = _.pick(user, ['oldPassword', 'password']);
  const schema = Joi.object({
    oldPassword: Joi.string().min(5).max(50).required(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(requiredUserModel);
}


function validateLogin(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
    
  });

  return schema.validate(req);
}



exports.User = User; 
exports.validateRegister = validateRegister;
exports.validateLogin = validateLogin;
exports.validateEdit = validateEdit;
exports.validateChangePassword = validateChangePassword;
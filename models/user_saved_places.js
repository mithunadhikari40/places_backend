
const Joi = require('joi');
const mongoose = require('mongoose');

const userSavedPlacesSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50
  },
  image: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  city: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255
  },
  street: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255
  },
  address: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255
  },
  monument: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  }, createdAt: Date,
});

const UserSavedAddress = mongoose.model('userSavedPlacesSchema', userSavedPlacesSchema);

function validateUserPlace(user) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    city: Joi.string().max(255).required(),
    street: Joi.string().min(2).max(255).required(),
    address: Joi.string().min(2).max(255).required(),
    monument: Joi.string(),
    description: Joi.string(),
    latitude: Joi.number(),
    longitude: Joi.number(),
  });

  return schema.validate(user);
}



exports.UserSavedPlaces = UserSavedAddress;
exports.validateUserPlace = validateUserPlace;

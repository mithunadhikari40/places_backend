const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50
  },
  area: {
    type: String,
    required: true,
    enum:['North Area','South Area','East Area','West Area'],
    minlength: 5,
    maxlength: 255,
  }
});
const City = mongoose.model('City', citySchema);

function validateCity(city) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    area: Joi.string().min(2).max(255).required()
  });

  return schema.validate(city);
}

exports.City = City; 
exports.validateCity = validateCity;

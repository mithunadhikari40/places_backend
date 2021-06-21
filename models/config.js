const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  tax: {
    type: Number,
    required: true,
    default: 13,
    min: 0
  },
  serviceCharge: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
});
const Config = mongoose.model('Config', configSchema);

function validateConfig(config) {
  const schema = Joi.object({
    tax: Joi.number().min(0).max(100).required(),
    serviceCharge: Joi.number().min(0).max(100).required()
  });

  return schema.validate(config);
}

exports.Config = Config; 
exports.validateConfig = validateConfig;

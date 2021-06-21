const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  },
  image: {
    type: String
  },
  qtyAvailable: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  unit: [{
    type: String,
    enum: ['weight', 'piece', 'package'],
    minlength: 2,
    maxlength: 255
  }],
  packingMethods: [{
    methodId: {
      type: mongoose.Schema.Types.ObjectId, ref: 'PackingMethod'
    }, extraPrice: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  cuttingMethods: [{
    methodId: {
      type: mongoose.Schema.Types.ObjectId, ref: 'CuttingMethod'
    }, extraPrice: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  description: {
    type: String,
  },
  size: [{
    name: String,
    price: Number,
    description: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }

});


const Product = mongoose.model('Product', productSchema);

function validateProduct(product) {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    qtyAvailable: Joi.string().required(),
    //because form data sends all values as string
    // so we are here checking for the string values
    // just a hack for now
    price: Joi.string().required(),
    unit: Joi.string().required(),
    description: Joi.string().allow('',null),

    // because form data does not allow sending arryays, if we send arrays, then it would covert to string
    //so here we are validating packingmethods and cuttingmethods to be string
    //and in api we will split the string into the arrays
    packingMethods: Joi.string().required(),
    cuttingMethods: Joi.string().required(),
    specialNote: Joi.string(),
    size: Joi.string().required(),
    image: Joi.string(),
    // checking if the category is already there or not
    category: Joi.string().required()

  });

  return schema.validate(product);
}
exports.Product = Product;
exports.validateProduct = validateProduct;

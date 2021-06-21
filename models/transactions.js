const Joi = require('joi');
const { join } = require('lodash');
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  id: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  created: {
    type: String,
    required: true,
  },
  transactionNumber: {
    type: String,
    required: true,
  },

});

const Transaction = mongoose.model('Transaction', transactionSchema);

function validateTransaction(trans) {
  const schema = Joi.object({
    id: Joi.number().min(0).required(),
    total: Joi.number().min(0).required(),
    transactionNumber: Joi.string().required(),
    created: Joi.string(),

  });

  return schema.validate(trans);
}

exports.Transaction = Transaction;
exports.validateTransaction = validateTransaction;

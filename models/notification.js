const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  title: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100
  },
  body: {
    type: String,
    required: true
  },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentToEveryone: {type: Boolean, default: true},
  createdAt: {
    type: Date,
    default: Date.now,
}
});


const Notification = mongoose.model('Notification', notificationSchema);

exports.Notification = Notification;

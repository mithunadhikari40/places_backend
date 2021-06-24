const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  places: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserSavedAddress' }],
});


const Favorite = mongoose.model('Favorite', favoriteSchema);

exports.Favorite = Favorite;

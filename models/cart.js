const Joi = require('joi');
const { join } = require('lodash');
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    
    subTotal: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    extraPrice: {
        type: Number,
        required: true,
    },
    serviceCharge: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        required: true
    },
    updatedDate: {
        type: Date,
        default: Date
    },
    sequence:{
        type: Number,
        required: true,
    },
    specialInstruction: String,
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],


});


const Cart = mongoose.model('Cart', cartSchema);

function validateCart(cart) {
    const schema = Joi.object({
        subTotal: Joi.number().min(0).required(),
        product: Joi.string().required(),
        total: Joi.number().min(0).required(),
        extraPrice: Joi.number().min(0).required(),
        tax: Joi.number().min(0).required(),
        serviceCharge: Joi.number().min(0).required(),
        orders: Joi.array().required(),
        specialInstruction:Joi.string().allow('',null),

    });

    return schema.validate(cart);
}

exports.Cart = Cart;
exports.validateCart = validateCart;

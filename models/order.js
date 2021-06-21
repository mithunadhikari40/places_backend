const Joi = require('joi');
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },

    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    unit: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255
    },
    packingMethod: {
        type: String,
        required: true
    },
    cuttingMethod:{
         type: String,
        required: true
    },
    specialNote: {
        type: String,
    },
    size: {
        type: String,

    },
    sequence:{
        type: Number,
        required: true,

    },
    createdAt: {
        type: Date,
        default: Date.now,
    }

});


const Order = mongoose.model('Order', orderSchema);

function validateOrder(order) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
        quantity: Joi.number().min(0).required(),
        price: Joi.number().min(0).required(),
        unit: Joi.string().required(),
        packingMethod: Joi.string().required(),
        cuttingMethod: Joi.string().required(),
        specialNote: Joi.string().allow('',null),
        category: Joi.string().required(),
        size: Joi.string().allow('',null),
    });

    return schema.validate(order);
}
exports.Order = Order;
exports.validateOrder = validateOrder;

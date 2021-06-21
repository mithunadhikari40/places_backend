const Joi = require('joi');
const { join } = require('lodash');
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subTotal: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
     extraPrice: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    serviceCharge: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 1024
    },
    paymentMethod: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 1024
    },
    transactionNumber: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 1024
    },
    streetAddress: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 1024
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'completed', 'cancelled'],
        minlength: 3,
        maxlength: 255,
    },
    updatedDate: {
        type: Date,
        default: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    sequence:{
        type: Number,
        required: true,

    },
    specialInstruction: String,
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],


});


const Invoice = mongoose.model('Invoice', invoiceSchema);

function validateInvoice(invoice) {
    const schema = Joi.object({
        subTotal: Joi.number().min(0).required(),
        total: Joi.number().min(0).required(),
        tax: Joi.number().min(0).required(),
        serviceCharge: Joi.number().min(0).required(),
        address: Joi.string().min(3).required(),
        paymentMethod: Joi.string().min(2).required(),
        transactionNumber: Joi.string().min(2).required(),
        streetAddress: Joi.string().min(2).required(),
        status: Joi.string().required(),
        orders: Joi.array().required(),
        extraPrice: Joi.number().min(0).required(),
        location: Joi.object(),
        specialInstruction:Joi.string().allow('',null),

    });

    return schema.validate(invoice);
}
function validateInvoiceByAdmin(invoice) {
    const schema = Joi.object({
        subTotal: Joi.number().min(0).required(),
        total: Joi.number().min(0).required(),
        tax: Joi.number().min(0).required(),
        serviceCharge: Joi.number().min(0).required(),
        address: Joi.string().min(10).required(),
        paymentMethod: Joi.string().min(2).required(),
        transactionNumber: Joi.string().min(2).required(),
        streetAddress: Joi.string().min(2).required(),
        status: Joi.string().required(),
        extraPrice: Joi.number().min(0).required(),
        orders: Joi.array().required(),
        location: Joi.object(),
        specialInstruction:Joi.string(),
    });

    return schema.validate(invoice);
}
exports.Invoice = Invoice;
exports.validateInvoiceByAdmin = validateInvoiceByAdmin;
exports.validateInvoice = validateInvoice;

const Joi = require('joi');
const mongoose = require('mongoose');

const packingMethodSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100,
    },
    image: String,
    description: String,
    createdAt: {
        type: Date,
        default: Date.now
    }

});


const PackingMethod = mongoose.model('PackingMethod', packingMethodSchema);

function validatePackingMethod(packingMethod) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
    });

    return schema.validate(packingMethod);
}
exports.PackingMethod = PackingMethod;
exports.validatePackingMethod = validatePackingMethod;

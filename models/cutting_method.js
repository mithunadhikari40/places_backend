const Joi = require('joi');
const mongoose = require('mongoose');

const cuttingMethodSchema = new mongoose.Schema({
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
        default: Date.now,
    }

});


const CuttingMethod = mongoose.model('CuttingMethod', cuttingMethodSchema);

function validateCuttingMethod(cuttingMethod) {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
        
    });

    return schema.validate(cuttingMethod);
}
exports.CuttingMethod = CuttingMethod;
exports.validateCuttingMethod = validateCuttingMethod;

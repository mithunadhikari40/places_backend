const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const mongoose = require('mongoose');
const express = require('express');
const { Parser, transforms: { unwind } } = require('json2csv');
const fs = require("fs");

const { v4: uuidv4 } = require('uuid');
var path = require('path');
const { Product, validateProduct } = require('../models/products');
const { PackingMethod } = require('../models/packing_method');
const { CuttingMethod } = require('../models/cutting_method');


const router = express.Router();

router.get('/', auth, async (req, res) => {
    const products = await Product.find().populate('category').populate('packingMethods.methodId', '-__v').populate('cuttingMethods.methodId').sort('name');
    res.json(products);
});

router.get('/top6', [auth,admin], async (req, res) => {
    const products = await Product.find().populate('packingMethods.methodId', '-__v').populate('cuttingMethods.methodId').limit(6).sort('name');
    res.json(products);
});
router.get('/download', [auth,admin], async (req, res) => {
    const products = await Product.find({},'-__v -updatedAt').populate('packingMethods.methodId', '-__v').populate('cuttingMethods.methodId').sort('name');
    
    let _finalResult = [];
    for (let _p of products) {
        let finalObj = {};
        const _packingMethods = [];
        for (const _pMethod of _p.packingMethods) {
            _packingMethods.push({
                extraPrice: _pMethod.extraPrice,
                name: _pMethod.methodId.name,
                description: _pMethod.methodId.description,
            });
        }
        const _cuttingMethods = [];
        for (const _pMethod of _p.cuttingMethods) {
            _cuttingMethods.push({
                extraPrice: _pMethod.extraPrice,
                name: _pMethod.methodId.name,
                description: _pMethod.methodId.description,
            });
        }
            _p.cuttingMethods = _cuttingMethods;
            const _sizeList = [];
            
            finalObj.cuttingMethods = _cuttingMethods;
            finalObj.packingMethods = _packingMethods;
            finalObj.unit = _p.unit.join(",");
            finalObj.name = _p.name;
            finalObj.description = _p.description;
            finalObj.quantityAvailable = _p.qtyAvailable;
            finalObj.price = _p.price;
        
            for(const _size of _p.size){
                _sizeList.push({
                    name: _size.name,
                    price: _size.price,
                    description: _size.description
                });
            }
            finalObj.size = _sizeList;
            _finalResult.push(finalObj);
    }

    const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
    const filePath = `public/uploads/files/products-${dateTime}.csv`;
    let csv;
    const fields = [
        'cuttingMethods.extraPrice', 
        'cuttingMethods.name', 
        'cuttingMethods.description',
        'packingMethods.extraPrice', 
        'packingMethods.name', 
        'packingMethods.description',  
        'unit',
        'name',
        'description',
        'quantityAvailable',
        'price',
        'size.name',
        'size.price',
        'size.description'

    ];
    const transforms = [unwind({ paths: ['cuttingMethods', 'packingMethods','size'] })];


    try {
        const json2csvParser = new Parser({ fields, transforms });
 csv = json2csvParser.parse(_finalResult);
 
        // csv = json2csv(_finalResult, { fields });
    } catch (err) {
        return res.status(500).json({ err });
    }

    fs.writeFile(filePath, csv, function (err) {
        if (err) {
            return res.json(err).status(500);
        }
        else {
            setTimeout(function () {
                fs.unlink(filePath, function (err) { // delete this file after 30 seconds
                    if (err) {
                        console.error(err);
                    }
                    console.log('File has been Deleted');
                });

            }, 30000);
            res.json({filePath});
        }
    })

});

router.post('/', [auth, admin], async (req, res) => {
    // return res.status(400).json({ error: req.body });

    const { error } = validateProduct(req.body);
    console.log('got price in product', req.body.price);
    if (error) return res.status(400).json({ validattionError: error.details[0].message });
    if (!req.body.packingMethods) {
        return res.status(400).json({ error: "Packing method is required" });
    } if (!req.body.cuttingMethods) {
        return res.status(400).json({ error: "Cutting method is required" });
    }
    let product = await Product.findOne({ name: req.body.name, unit: req.body.unit });
    if (product) {
        product.qtyAvailable = product.qtyAvailable + parseInt(req.body.qtyAvailable);
        product = await product.save();
        return res.json({ product });

    }
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded.' });
    }

    const image = req.files.image;

    if (!image) {
        return res.status(400).json({ error: 'No files were uploaded.' + image });
    }
    const filename = uuidv4();
    const mimetype = image.mimetype;
    if (!mimetype.includes("image")) {
        return res.status(400).json({ error: 'Invalid file uploaded, please upload an image' });
    }
    const extension = mimetype.toString().replace("image/", "");

    const imagePath = `public/uploads/products/${filename}.${extension}`;


    image.mv(imagePath, async function (err) {
        if (err) {
            return res.status(400).json({ error: 'Something went wrong while uploading the image.', stack: err });
        }
        let _packingMethods = [];
        // const  _packingMethodList = [];
        // const  _cuttingMethodList = [];

        // try {
        //     if (typeof req.body.packingMethods === 'string') {
        //         _packingMethods = req.body.packingMethods.split(",").map((e) => mongoose.Types.ObjectId(e));
        //     } else {
        //         _packingMethods = req.body.packingMethods.map((e) => mongoose.Types.ObjectId(e));
        //     }

        // } catch (error) {
        //     return res.status(400).json({ error: 'Invalid packing method ids provided', stack: err });

        // }


        try {
            if (typeof req.body.packingMethods === 'string') {


                _packingMethods = JSON.parse(req.body.packingMethods).map((e) => ({
                    methodId: e["_id"],
                    extraPrice: e["extraPrice"]
                }));

            } else {

                _packingMethods = req.body.cuttingMethods.map((e) => ({
                    methodId: e._id,
                    extraPrice: e.extraPrice
                }));
                return res.status(400).json({ error: _packingMethods });

            }

        } catch (err) {
            return res.status(400).json({ error: 'Invalid packing method ids provided', stack: err });

        }


        // for (const method of _packingMethods) {
        //     const _temp = await PackingMethod.findById(method);
        //     _packingMethodList.push(_temp);
        // }

        let _cuttingMethods = [];
        try {
            if (typeof req.body.cuttingMethods === 'string') {
                _cuttingMethods = JSON.parse(req.body.cuttingMethods).map((e) => ({
                    methodId: e["_id"],
                    extraPrice: e["extraPrice"]
                }));
            } else {
                _cuttingMethods = req.body.cuttingMethods.map((e) => ({
                    methodId: e.methodId,
                    extraPrice: e._id
                }));
            }
        } catch (error) {
            return res.status(400).json({ error: 'Invalid cutting method ids provided', stack: error });

        }


        let _sizes = [];
        try {
            if (typeof req.body.size === 'string') {
                _sizes = JSON.parse(req.body.size).map((e) => ({
                    name: e["name"],
                    price: e["price"],
                    description: e["description"]
                }));
            } else {
                _sizes = req.body.size.map((e) => ({
                    name: e.name,
                    price: e.price,
                    description: e.description
                }));
            }
        } catch (error) {
            return res.status(400).json({ error: 'Invalid sizes provided', stack: error });

        }

        let _units = [];
        try {
            if (typeof req.body.unit === 'string') {
                

                _units = JSON.parse(req.body.unit).map((e) => e);
                // _units = JSON.parse(req.body.unit).map((e) => e);
            } else {
                // return res.status(400).json({ error: 'Invalid units second', stack: req.body.unit});

                _units = req.body.unit;
            }
        } catch (error) {
            return res.status(400).json({ error: 'Invalid units provided', stack: error });
        }

        // for (const method of _cuttingMethods) {
        //     const _temp = await CuttingMethod.findById(method);
        //     _cuttingMethodList.push(_temp);
        // }
        const price = parseInt(req.body.price);
        const qtyAvailable = parseInt(req.body.qtyAvailable);

        const { name, description } = req.body;
        const category = mongoose.Types.ObjectId(req.body.category);
        // return res.status(400).json({ error: ' invalid error test Invalid cutting method ids provided', stack: _packingMethods });
        product = new Product({
            name, image: imagePath, category,qtyAvailable, price, unit: _units,
            packingMethods: _packingMethods, description, cuttingMethods: _cuttingMethods,
            size: _sizes
        });
        product = await product.save();

        res.json({ product });
    });




});

router.put('/:id', [auth, admin], async (req, res) => {
    const { error } = validateProduct(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const updated = Date();

    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).jsres.status(404).json({ error: 'The Product with the given ID was not found at the start' });


    let _packingMethods = [];
    try {
        if (typeof req.body.packingMethods === 'string') {
            _packingMethods = JSON.parse(req.body.packingMethods).map((e) => ({
                methodId: e["_id"],
                extraPrice: e["extraPrice"]
            }));

        } else {
            _packingMethods = req.body.cuttingMethods.map((e) => ({
                methodId: e._id,
                extraPrice: e.extraPrice
            }));
            return res.status(400).json({ error: _packingMethods });
        }

    } catch (err) {
        return res.status(400).json({ error: 'Invalid packing method ids provided', stack: err });

    }

    let _cuttingMethods = [];
    try {
        if (typeof req.body.cuttingMethods === 'string') {
            _cuttingMethods = JSON.parse(req.body.cuttingMethods).map((e) => ({
                methodId: e["_id"],
                extraPrice: e["extraPrice"]
            }));
        } else {
            _cuttingMethods = req.body.cuttingMethods.map((e) => ({
                methodId: e._id,
                extraPrice: e.extraPrice
            }));
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid cutting method ids provided', stack: err });

    }

    let _sizes = [];
    try {
        if (typeof req.body.size === 'string') {
            _sizes = JSON.parse(req.body.size).map((e) => ({
                name: e["name"],
                price: e["price"],
                description: e["description"]
            }));
        } else {
            _sizes = req.body.size.map((e) => ({
                name: e.name,
                price: e.price,
                description: e.description
            }));
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid sizes provided', stack: err });
    }

    let _units = [];
    try {
        if (typeof req.body.unit === 'string') {
            _units = JSON.parse(req.body.unit).map((e) => e);
        } else {
            _units = req.body.unit;
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid units provided', stack: err });
    }

    if (req.files && Object.keys(req.files).length > 0 && req.files.image) {
        //here we have the image
        const image = req.files.image;

        const filename = uuidv4();
        const mimetype = image.mimetype;
        if (!mimetype.includes("image")) {
            return res.status(400).json({ error: 'Invalid file uploaded, please upload an image' });
        }
        const extension = mimetype.toString().replace("image/", "");

        const imagePath = `public/uploads/products/${filename}.${extension}`;


        image.mv(imagePath, async function (err) {
            if (err) {
                return res.status(400).json({ error: 'Something went wrong while uploading the image.', stack: err });
            }


            const price = parseInt(req.body.price);
            const qtyAvailable = parseInt(req.body.qtyAvailable);

            const { name, description } = req.body;
            const category = mongoose.Types.ObjectId(req.body.category);


            product = await Product.findByIdAndUpdate(req.params.id, {
                name, image: imagePath, qtyAvailable, price, unit: _units,
                packingMethods: _packingMethods, description,category,
                cuttingMethods: _cuttingMethods, size: _sizes
            }, {
                new: true
            });

            if (!product) return res.status(404).json({ error: 'The Product with the given ID was not found.' });

            res.json(product);

        });
    } else {
        //here we don't have the image


        const price = parseInt(req.body.price);
        const qtyAvailable = parseInt(req.body.qtyAvailable);
        const category = mongoose.Types.ObjectId(req.body.category);


        const { name, description } = req.body;
        product = await Product.findByIdAndUpdate(req.params.id, {
            name, qtyAvailable, price, unit: _units,
            packingMethods: _packingMethods, category,
            description, cuttingMethods: _cuttingMethods, size: _sizes
        }, {
            new: true
        });

        if (!product) return res.status(404).json({ error: 'The Product with the given ID was not found.' });

        res.json(product);

    }

});

router.delete('/:id', [auth, admin], async (req, res) => {
    const product = await Product.findByIdAndRemove(req.params.id);

    if (!product) return res.status(404).json({ error: 'The Product with the given ID was not found.' });

    res.json(product);
});
router.delete('/deleteMultiple/:id', [auth, admin], async (req, res) => {
    let ids = [];
    if (!Array.isArray(req.params.id)) {
        ids = req.params.id.split(",");
    } else {
        ids = req.params.id;
    }
    if (!Array.isArray(ids)) {
        return res.status(404).json({ error: 'Id should be an array.' });
    }
    const product = await Product.deleteMany({ _id: { $in: ids } });

    if (!product) return res.status(404).json({ error: 'The Products with the given IDS were not found.' });

    res.json(product);
});

router.get('/:id', auth, async (req, res) => {
    let product;

    if (req.params.id === "undefined" || req.params.id === "null") {
        console.log(req.params.id, 'id is this', typeof req.params.id);

        product = await Product.find().populate('category').populate('packingMethods.methodId', '-__v', '-_id').populate('cuttingMethods.methodId').sort({ 'createdAt': -1 }).limit(1);

    } else {
        product = await Product.findById(req.params.id).populate('category').populate('packingMethods.methodId', '-__v -_id').populate('cuttingMethods.methodId').sort('name');

    }

    if (!product) return res.status(404).json({ error: 'The product with the given ID was not found.' });

    res.json({ product });
});


module.exports = router;
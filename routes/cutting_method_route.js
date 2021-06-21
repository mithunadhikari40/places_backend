const express = require('express');
const { v4: uuidv4 } = require('uuid');
var path = require('path');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const json2csv = require('json2csv').parse;
const fs = require("fs");

const { CuttingMethod, validateCuttingMethod } = require('../models/cutting_method');
const router = express.Router();


router.get('/', auth, async (req, res) => {
    const methods = await CuttingMethod.find().sort('name');
    res.json(methods);
});

router.get('/download', [auth,admin], async (req, res) => {
    const methods = await CuttingMethod.find({}).sort('name');
    const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
    const filePath = `public/uploads/files/cuttingMethod-${dateTime}.csv`;
    let csv;
    const fields = ['_id', 'name', 'description'];

    try {
        csv = json2csv(methods, { fields });
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

router.post('/', [auth,admin], async (req, res) => {
    const { error } = validateCuttingMethod({ name: req.body.name });

    if (error) return res.status(400).json({ error: error.details[0].message });


    let method = await CuttingMethod.findOne({ name: req.body.name });
    if (method) return res.status(400).json({ error: 'Cutting method already exists with the given name.' });
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded. Validation failed' });

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

    const imagePath = `public/uploads/cuttingMethod/${filename}.${extension}`;


    image.mv(imagePath, async function (err) {
        if (err) {
            return res.status(400).json({ error: 'Something went wrong while uploading the image.', stack: err });
        }
        let method = new CuttingMethod({
            name: req.body.name,
            image: imagePath,
            description: req.body.description,
        });
        method = await method.save();

        res.send(method);

    });


});

router.put('/:id', [auth,admin], async (req, res) => {
    const { error } = validateCuttingMethod({ name: req.body.name });

    if (error) return res.status(400).json({ error: error.details[0].message });



    if (req.files && Object.keys(req.files).length > 0) {
        //here we have images
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

        const imagePath = `public/uploads/cuttingMethod/${filename}.${extension}`;

        image.mv(imagePath, async function (err) {
            if (err) {
                return res.status(400).json({ error: 'Something went wrong while uploading the image.', stack: err });
            }

            const method = await CuttingMethod.findByIdAndUpdate(req.params.id,
                { image: imagePath, name: req.body.name, description: req.body.description },{new: true});

            if (!method) return res.status(404).json({ error: 'The method with the given ID was not found.' });

            res.json(method);

        });

    } else {
        //here we don't have an image
        const method = await CuttingMethod.findByIdAndUpdate(req.params.id, { name: req.body.name, description: req.body.description }, {
            new: true
        });

        if (!method) return res.status(404).json({ error: 'The method with the given ID was not found.' });

        res.json(method);
    }

});

router.delete('/:id', [auth, admin], async (req, res) => {
    const method = await CuttingMethod.findByIdAndRemove(req.params.id);

    if (!method) return res.status(404).json({ error: 'The cutting method with the given ID was not found.' });

    res.json(method);
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
    const product = await CuttingMethod.deleteMany({ _id: { $in: ids } });

    if (!product) return res.status(404).json({ error: 'The methods with the given IDS were not found.' });

    res.json(product);
});


router.get('/:id', auth, async (req, res) => {
    const method = await CuttingMethod.findById(req.params.id);

    if (!method) return res.status(404).json({ error: 'The method with the given ID was not found.' });

    res.json({ method });
});

module.exports = router;
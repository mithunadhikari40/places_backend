const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { City, validateCity } = require('../models/city');
const mongoose = require('mongoose');
const express = require('express');
const json2csv = require('json2csv').parse;
const fs = require("fs");
const { Category, validateCategory } = require('../models/category');
const router = express.Router();


router.get('/',  [auth], async (req, res) => {
    const category = await Category.find().sort('name');
    res.json({category});
});


router.get('/download', [auth, admin], async (req, res) => {
    const categories = await Category.find({}).sort('name');
    const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
    const filePath = `public/uploads/files/categories-${dateTime}.csv`;
    let csv;
    const fields = ['_id', 'name', 'area'];

    try {
        csv = json2csv(categories, { fields });
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
    const { error } = validateCategory(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    let category = await Category.findOne({ name: req.body.name });
    if (category) return res.status(400).json({ error: 'Category already exists with the given name.' });

    category = new Category({ name: req.body.name });
    category = await category.save();

    res.json({ category });
});

router.put('/:id', [auth, admin], async (req, res) => {
    console.log('tha values we get is ', req.body);
    const { error } = validateCategory(req.body);

    if (error) return res.status(400).json({ error: error.details[0].message });

    const category = await Category.findByIdAndUpdate(req.params.id, { 
        name: req.body.name,
        updated: Date.now()
     }, {
        new: true
    });

    if (!category) return res.status(404).json({ error: 'The category with the given ID was not found.' });

    res.json(category);
});

router.delete('/:id', [auth, admin], async (req, res) => {
    const category = await Category.findByIdAndRemove(req.params.id);

    if (!category) return res.status(404).json({ error: 'The category with the given ID was not found.' });

    res.json(category);
});

router.get('/:id', auth, async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) return res.status(404).json({ error: 'The category with the given ID was not found.' });

    res.json({ category });
});

module.exports = router;
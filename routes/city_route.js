const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { City, validateCity } = require('../models/city');
const mongoose = require('mongoose');
const express = require('express');
const json2csv = require('json2csv').parse;
const fs = require("fs");
const router = express.Router();


router.get('/', async (req, res) => {
    const cities = await City.find().sort('name');
    res.json({city:cities});
});


router.get('/download', [auth, admin], async (req, res) => {
    const cities = await City.find({}).sort('name');
    const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
    const filePath = `public/uploads/files/cities-${dateTime}.csv`;
    let csv;
    const fields = ['_id', 'name', 'area'];

    try {
        csv = json2csv(cities, { fields });
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
    const { error } = validateCity(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    let city = await City.findOne({ name: req.body.name, area: req.body.area });
    if (city) return res.status(400).json({ error: 'City already exists with the given area.' });

    city = new City({ name: req.body.name, area: req.body.area });
    city = await city.save();

    res.json({ city });
});

router.put('/:id', [auth,admin], async (req, res) => {
    console.log('tha values we get is ', req.body);
    const { error } = validateCity(req.body);

    if (error) return res.status(400).json({ error: error.details[0].message });

    const city = await City.findByIdAndUpdate(req.params.id, { name: req.body.name, area: req.body.area }, {
        new: true
    });

    if (!city) return res.status(404).json({ error: 'The city with the given ID was not found.' });

    res.json(city);
});

router.delete('/:id', [auth, admin], async (req, res) => {
    const city = await City.findByIdAndRemove(req.params.id);

    if (!city) return res.status(404).json({ error: 'The city with the given ID was not found.' });

    res.json(city);
});

router.get('/:id', async (req, res) => {
    const city = await City.findById(req.params.id);

    if (!city) return res.status(404).json({ error: 'The city with the given ID was not found.' });

    res.json({ city });
});

module.exports = router;
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { Config, validateConfig } = require('../models/config');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();


router.get('/',[auth], async (req, res) => {
    const config = await Config.find();
    res.json({config});
});


router.post('/', [auth, admin], async (req, res) => {
    const { error } = validateConfig(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    let config = await Config.findOne({});
    if (config) return res.status(400).json({ error: 'config already exists.' });

    config = new Config({ tax: req.body.tax, serviceCharge: req.body.serviceCharge });
    config = await config.save();

    res.json({ config });
});

router.put('/:id', [auth,admin], async (req, res) => {
    console.log('tha values we get is ', req.body);
    const { error } = validateConfig(req.body);

    if (error) return res.status(400).json({ error: error.details[0].message });

    const config = await Config.findByIdAndUpdate(req.params.id, { tax: req.body.tax, serviceCharge: req.body.serviceCharge }, {
        new: true
    });

    if (!config) return res.status(404).json({ error: 'The config with the given ID was not found.' });

    res.json(config);
});

router.delete('/:id', [auth, admin], async (req, res) => {
    const config = await Config.findByIdAndRemove(req.params.id);

    if (!config) return res.status(404).json({ error: 'The config with the given ID was not found.' });

    res.json(config);
});


module.exports = router;
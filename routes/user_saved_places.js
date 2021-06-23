const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
var path = require('path');


const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { User } = require('../models/user');

const { UserSavedPlaces, validateUserPlace } = require('../models/user_saved_places');
const router = express.Router();
router.get('/', auth, async (req, res) => {
    const user = req.user;
    let savedAddress;
    if (user.isAdmin) {
        savedAddress = await UserSavedPlaces.find().sort('name');
    } else {
        savedAddress = await UserSavedPlaces.find({ user: user._id }).sort('name');
    }
    res.json(savedAddress);
});
router.get('/all', async (req, res) => {

    const savedAddress = await UserSavedPlaces.find().sort('name');

    res.json(savedAddress);
});

router.post('/', auth, async (req, res) => {

    const { error } = validateUserPlace(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    let user = await User.findById(req.user._id);

    if (!user) return res.status(400).json({ error: 'User Not found' });

    let place = await UserSavedPlaces.findOne({ name: req.body.name, user: req.user });
    if (place) return res.status(400).json({ error: 'Place already exists with the given name.' });


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

    const imagePath = `public/uploads/places/${filename}.${extension}`;



    image.mv(imagePath, async function (err) {
        if (err) {
            return res.status(400).json({ error: 'Something went wrong while uploading the image.', stack: err });
        }
        // let method = new CuttingMethod({
        //     name: req.body.name,
        //     image: imagePath,
        //     description: req.body.description,
        // });
        // method = await method.save();

        // res.send(method);


        const { name, city, street, monument, latitude, longitude, address, description } = req.body;
        const date = Date();

        place = new UserSavedPlaces({ name, city, street, address, image: imagePath, description, monument, latitude, longitude, created: date, user });
        place = await place.save();
        place = _.pick(place, ['_id', 'name', 'city', 'street', 'image', 'description', 'address', 'monument', 'latitude', 'longitude', 'created']);


        res.json({ place });

    });



});

router.put('/:id', auth, async (req, res) => {
    const { error } = validateUserPlace(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const user = req.user;
    const _addr = await UserSavedPlaces.findById(req.params.id);

    if (_addr.user.toString() !== user._id.toString()) {
        return res.status(400).json({ error: "You are not authorized to edit this document" });
    }

    const address = await UserSavedPlaces.findByIdAndUpdate(req.params.id, { name: req.body.name }, {
        new: true
    });

    if (!address) return res.status(404).json({ error: 'The address with the given ID was not found.' });

    res.json(address);
});

router.delete('/:id', [auth], async (req, res) => {
    const user = req.user;
    const _addr = await UserSavedPlaces.findById(req.params.id);

    if (_addr.user.toString() !== user._id.toString()) {
        return res.status(400).json({ error: "You are not authorized to delete this document" });
    }
    const address = await UserSavedPlaces.findByIdAndRemove(req.params.id);

    if (!address) return res.status(404).json({ error: 'The address with the given ID was not found.' });

    res.json(address);
});

router.get('/:id', auth, async (req, res) => {
    const address = await UserSavedPlaces.findById(req.params.id);

    if (!address) return res.status(404).json({ error: 'The address with the given ID was not found.' });

    res.json({ address });
});

module.exports = router;
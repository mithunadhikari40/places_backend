const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');


const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { User } = require('../models/user');

const { UserSavedAddress, validateUserAddress } = require('../models/user_saved_address');
const router = express.Router();
router.get('/', auth, async (req, res) => {
    const user=  req.user;
    let savedAddress;
    if(user.isAdmin){
         savedAddress = await UserSavedAddress.find().sort('name');
    }else{
         savedAddress = await UserSavedAddress.find({user:user._id}).sort('name');
    }
    res.json(savedAddress);
});

router.post('/', auth, async (req, res) => {
    const { error } = validateUserAddress(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    let address = await UserSavedAddress.findOne({ name: req.body.name, user: req.user });
    if (address) return res.status(400).json({ error: 'Address already exists with the given name.' });
    let user = await User.findById(req.user._id);

    if (!user) return res.status(400).json({ error: 'User Not found' });

    const { name, city, street, monument, latitude, longitude } = req.body;
    const date = Date();
    const userAddress = req.body.address;

    address = new UserSavedAddress({ name, city, street,address: userAddress, monument, latitude, longitude, created: date, user });
    address = await address.save();
    address =_.pick(address, ['_id','name', 'city', 'street', 'address', 'monument', 'latitude', 'longitude','created']);


    res.json({ address });
});

router.put('/:id', auth, async (req, res) => {
    const { error } = validateUserAddress(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const user = req.user;
    const _addr = await UserSavedAddress.findById(req.params.id);

    if(_addr.user.toString() !== user._id.toString()){
        return res.status(400).json({ error:"You are not authorized to edit this document" });
    }

    const address = await UserSavedAddress.findByIdAndUpdate(req.params.id, { name: req.body.name }, {
        new: true
    });

    if (!address) return res.status(404).json({ error: 'The address with the given ID was not found.' });

    res.json(address);
});

router.delete('/:id', [auth], async (req, res) => {
    const user = req.user;
    const _addr = await UserSavedAddress.findById(req.params.id);

    if(_addr.user.toString() !== user._id.toString()){
        return res.status(400).json({ error:"You are not authorized to delete this document" });
    }
    const address = await UserSavedAddress.findByIdAndRemove(req.params.id);

    if (!address) return res.status(404).json({ error: 'The address with the given ID was not found.' });

    res.json(address);
});

router.get('/:id', auth, async (req, res) => {
    const address = await UserSavedAddress.findById(req.params.id);

    if (!address) return res.status(404).json({ error: 'The address with the given ID was not found.' });

    res.json({ address });
});

module.exports = router;
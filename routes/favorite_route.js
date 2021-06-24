const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
var path = require('path');

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { User } = require('../models/user');
const { Favorite } = require('../models/favorite');

const { UserSavedPlaces, validateUserPlace } = require('../models/user_saved_places');
const router = express.Router();
router.get('/', auth, async (req, res) => {
    const user = req.user;
    let favorites = await Favorite.find({ user: user }).populate('places');
    favorites = favorites[0];

    favorites = _.pick(favorites, ['places']);
    res.json(favorites);
});


router.put('/', auth, async (req, res) => {

    const user = req.user;
    let favorites = await Favorite.findOne({ user: user });
    favorites = favorites ? favorites : [];

    const placeId = req.body.id;


    let list = favorites.length == 0 ? [] : favorites.places;



    if (list.includes(placeId)) {
        const index = list.indexOf(placeId);
        list.splice(index, 1);

    } else {
        list.push(placeId);
        // return res.json({includes,list});

    }
    list = list.filter(function (value, index) {
        return list.indexOf(value.toString()) == index;
    });


    let updated;
    if (favorites.length === 0) {
        updated = new Favorite({ user, places: list });
        updated = await updated.save();

    } else {
        updated = await Favorite.findOneAndUpdate({ user }, { $set: { places: list } },);

    }

    res.json(updated);
});
router.get('/isFavorite/:id', [auth], async (req, res) => {
    const user = req.user;
    let favorites = await Favorite.findOne({ user: user });
    favorites = favorites ? favorites : [];
    const placeId = req.params.id;

    let list = favorites.length == 0 ? [] : favorites.places;

    if (list.includes(placeId.toString())) {
        return res.json({ favorite: true, id: placeId });
    } else {
        return res.json({ favorite: false, id: placeId });
    }

});

// router.delete('/:id', [auth], async (req, res) => {
//     const user = req.user;
//     const _addr = await UserSavedPlaces.findById(req.params.id);

//     if (_addr.user.toString() !== user._id.toString()) {
//         return res.status(400).json({ error: "You are not authorized to delete this document" });
//     }
//     const address = await UserSavedPlaces.findByIdAndRemove(req.params.id);

//     if (!address) return res.status(404).json({ error: 'The address with the given ID was not found.' });

//     res.json(address);
// });

// router.get('/:id', auth, async (req, res) => {
//     const address = await UserSavedPlaces.findById(req.params.id);

//     if (!address) return res.status(404).json({ error: 'The address with the given ID was not found.' });

//     res.json({ address });
// });

module.exports = router;
const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
var path = require('path');
var axios = require('axios');


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
    let owner = await UserSavedPlaces.findById(placeId);
    owner = owner.user;




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
    if(user._id.toString() !== owner._id.toString()){
        //get the notification from the owner
        const pushToken = owner.pushToken;
        if(pushToken){
            //send a notfication

            //This is the data we are posting, it needs to be a string or a buffer
        const notificationData = {
            // "to": "eB5papU2Xdc:APA91bFFvc3dXru1fN5JY8U19oHIpfGhPUx7Ll7v9vJYTsIGZ15mDwB2Wpep3flLK85IUqqs2WqJwjYHSDYX28oJ1wTP0R2TDc2ba_uVjUauDcp3pCNKr_0KlghOnS",
            "registration_ids": pushToken,
            "notification": {
                "body": `${owner.name} added one of your place to their favorite list`,
                "OrganizationId": "2",
                "content_available": true,
                "priority": "high",
                "subtitle": "Elementary School",
                "Title": `Your place is getting popular.`
            },
            "data": {
                "priority": "high",
                "sound": "app_sound.wav",
                "content_available": true,
                "bodyText": `${owner.name} added one of your place to their favorite list`,
                "organization": "Elementary school",
                "click_action": "FLUTTER_NOTIFICATION_CLICK"
            }
        };
        axios
            .post('https://fcm.googleapis.com/fcm/send', notificationData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'key=AAAA9z9l4tY:APA91bHAkI_d3yCrBu9Co8T0IWpxo-vxe-LhopZEY3MXrMlJzeXG1gVKPl_V0tb_uMBdeek1QWszviyG7ciIoAlhRxMGWRAAYx7DCW7cTHLBlJ-KL64Q8Opx8oP2z-3EwHCZf5Zm3tbG'
                }
            })
            .then(res => {
                console.log(`statusCode of the response: ${res.statusCode}`)
                console.log(res)
                return res.json({ data: res });
            })
            .catch(error => {
                console.error(error);
                return res.json({  error });

            });


        }
    }
});




router.put('/testNotification', auth, async (req, res) => {   

    const token = req.body.token;

        if(token){
            //send a notfication

            //This is the data we are posting, it needs to be a string or a buffer
        const notificationData = {
            // "to": "eB5papU2Xdc:APA91bFFvc3dXru1fN5JY8U19oHIpfGhPUx7Ll7v9vJYTsIGZ15mDwB2Wpep3flLK85IUqqs2WqJwjYHSDYX28oJ1wTP0R2TDc2ba_uVjUauDcp3pCNKr_0KlghOnS",
            "registration_ids": token,
            "notification": {
                "body": ` Someone added one of your place to their favorite list`,
                "OrganizationId": "2",
                "content_available": true,
                "priority": "high",
                "subtitle": "Elementary School",
                "Title": `Your place is getting popular.`
            },
            "data": {
                "priority": "high",
                "sound": "app_sound.wav",
                "content_available": true,
                "bodyText": `Someone added one of your place to their favorite list`,
                "organization": "Elementary school",
                "click_action": "FLUTTER_NOTIFICATION_CLICK"
            }
        };
        axios
            .post('https://fcm.googleapis.com/fcm/send', notificationData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'key=AAAA9z9l4tY:APA91bHAkI_d3yCrBu9Co8T0IWpxo-vxe-LhopZEY3MXrMlJzeXG1gVKPl_V0tb_uMBdeek1QWszviyG7ciIoAlhRxMGWRAAYx7DCW7cTHLBlJ-KL64Q8Opx8oP2z-3EwHCZf5Zm3tbG'
                }
            })
            .then(res => {
                console.log(`statusCode of the response: ${res.statusCode}`)
                console.log(res)
                return res.json({ notificationData: res });
            })
            .catch(error => {
                console.error(error);
                return res.json({ notificationError: error });

            });


        }
    
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
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { Notification } = require('../models/notification');
const mongoose = require('mongoose');
const express = require('express');
const json2csv = require('json2csv').parse;
const fs = require("fs");
const axios = require('axios')
const { body, validationResult } = require('express-validator');
const { User } = require('../models/user');

const router = express.Router();


router.get('/', async (req, res) => {
    const notifications = await Notification.find({}).populate('fromUser').populate('users').sort('title');
    res.json(notifications);
});


router.get('/download', [auth, admin], async (req, res) => {
    const list = await Notification.find({}).sort('title');
    const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
    const filePath = `public/uploads/files/notifications-${dateTime}.csv`;
    let csv;
    const fields = ['_id', 'title', 'body', 'sentToEveryone', 'createdDate'];

    try {
        csv = json2csv(list, { fields });
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
            res.json({ filePath });
        }
    })

});


router.post('/',
    body('title').isLength({ min: 3 }),
    body('body').isLength({ min: 3 }),

    [auth, admin], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        let _users = [];
        if (req.body.users) {

            try {
                if (typeof req.body.users === 'string') {
                    _users = JSON.parse(req.body.users).map((e) => mongoose.Types.ObjectId(e));
                } else {

                    _users = req.body.users.map((e) => mongoose.Types.ObjectId(e));
                }
            } catch (error) {
                return res.status(400).json({ error: 'Invalid users provided', stack: error });
            }
        }
        let notification = new Notification({
            title: req.body.title,
            body: req.body.body,
            users: _users,
            fromUser: req.user,
            sentToEveryone: req.body.sentToEveryone

        });
        notification = await notification.save();
        res.json(notification);
       
        let pushTokenList = [];
        if (req.body.sentToEveryone) {
            pushTokenList = await User.find({}).select('pushToken -_id');
            pushTokenList = pushTokenList.map((e) => e.pushToken);

        } else {
            pushTokenList = await User.find({ _id: { $in: _users } }).select('pushToken -_id');
            pushTokenList = pushTokenList.map((e) => e.pushToken);

        }
        //This is the data we are posting, it needs to be a string or a buffer
        const notificationData = {
            // "to": "eB5papU2Xdc:APA91bFFvc3dXru1fN5JY8U19oHIpfGhPUx7Ll7v9vJYTsIGZ15mDwB2Wpep3flLK85IUqqs2WqJwjYHSDYX28oJ1wTP0R2TDc2ba_uVjUauDcp3pCNKr_0KlghOnS",
            "registration_ids": pushTokenList,
            "notification": {
                "body": req.body.body,
                "OrganizationId": "2",
                "content_available": true,
                "priority": "high",
                "subtitle": "Elementary School",
                "Title": req.body.title
            },
            "data": {
                "priority": "high",
                "sound": "app_sound.wav",
                "content_available": true,
                "bodyText": req.body.body,
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
                return res.json({ notificationData: re });
            })
            .catch(error => {
                console.error(error);
                return res.json({ notificationError: error });

            });
    });

// router.put('/:id', [auth, admin], async (req, res) => {
//     console.log('tha values we get is ', req.body);
//     const { error } = validateCity(req.body);

//     if (error) return res.status(400).json({ error: error.details[0].message });

//     const city = await City.findByIdAndUpdate(req.params.id, { name: req.body.name, area: req.body.area }, {
//         new: true
//     });

//     if (!city) return res.status(404).json({ error: 'The city with the given ID was not found.' });

//     res.json(city);
// });

router.delete('/:id', [auth, admin], async (req, res) => {
    const notification = await Notification.findByIdAndRemove(req.params.id);

    if (!notification) return res.status(404).json({ error: 'The notification with the given ID was not found.' });

    res.json(notification);
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
    const notification = await Notification.deleteMany({ _id: { $in: ids } });

    if (!notification) return res.status(404).json({ error: 'The notification with the given IDS were not found.' });

    res.json(notification);
});
router.get('/:id', async (req, res) => {
    const notification = await Notification.findById(req.params.id).populate('fromUser').populate('users').sort('title');


    if (!notification) return res.status(404).json({ error: 'The notification with the given ID was not found.' });

    res.json(notification);
});

module.exports = router;
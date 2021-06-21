const express = require('express');
const { intersection } = require('lodash');
const router = express.Router();
const { User } = require('../models/user');


const list = [
    {
        artist: "Taylor Swift",
        id:1,
        image:"https://pyxis.nymag.com/v1/imgs/0fd/e01/0ce0d5381e9930e3b567edfde650f7f69f-taylor-swift.rsquare.w1200.jpg",
        thumbnail:"https://pyxis.nymag.com/v1/imgs/0fd/e01/0ce0d5381e9930e3b567edfde650f7f69f-taylor-swift.rsquare.w1200.jpg",
        title: "Blank Space",
        url:"https://www.amazon.com/Taylor-Swift/dp/B0014I4KH6"
    },
    {
        artist: "Nickelback",
        id:2,
        image:"https://i1.sndcdn.com/artworks-000202828323-klj12a-t500x500.jpg",
        thumbnail:"https://i1.sndcdn.com/artworks-000202828323-klj12a-t500x500.jpg",
        title: "Burn It Down The Ground",
        url:"https://www.amazon.com/Best-Nickelback-1/dp/B00FFERTUK/"
    },
    {
        artist: "Bruno Mars",
        id:3,
        image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0-tmv8mUWSW5n58jVxpSFppT0j4zy9mS8HA&usqp=CAU",
        thumbnail:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0-tmv8mUWSW5n58jVxpSFppT0j4zy9mS8HA&usqp=CAU",
        title: "24K Magic",
        url:"https://www.amazon.com/24K-Magic-Vinyl-Digital-Download/dp/B01M02J3Y3/"
    },
    {
        artist: "Katty Perry",
        id:4,
        image:"https://i.pinimg.com/originals/18/cf/b8/18cfb82fb8312b304144da7736fbb5ad.jpg",
        thumbnail:"https://i.pinimg.com/originals/18/cf/b8/18cfb82fb8312b304144da7736fbb5ad.jpg",
        title: "Teenage Dream",
        url:"https://www.amazon.com/Smile-Bone-White-Katy-Perry/dp/B08C94RL27/"
    },

    {
        artist: "Imagine Dragons",
        id:5,
        image:"https://i.ytimg.com/vi/7wtfhZwyrcc/maxresdefault.jpg",
        thumbnail:"https://i.ytimg.com/vi/7wtfhZwyrcc/maxresdefault.jpg",
        title: "Believer",
        url:"https://www.amazon.com/s?k=imagine+dragons&i=music-intl-ship&crid=3S50SL61U91Q0/"
    },
];


router.get('/', async (req, res) => {
    res.json(list);
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;
    if(id< 1 || id>5){
         return res.status(404).json({ error: 'The album with the given ID was not found.' });
    }
    const result = list[parseInt(id)-1];
  
    res.json( result);
  });
  router.post('/signup', async (req, res) => {
    if(!req.body.email){
        return res.status(404).json({ error: 'Email is required.' });
    }
    if(!req.body.password){
        return res.status(404).json({ error: 'Password is required.' });
    }
    if(!req.body.gender){
        return res.status(404).json({ error: 'Gender is required.' });
    }
    var rand = Math.random() < 0.5;

   if(rand){
    const user = await User.findOne({ });
    return res.status(201).json({ message: 'Account created successfully.', user: user });
   }else{
    return res.status(404).json({ error: 'Something went wrong while creating the account, please try again.' });
   }
  });

module.exports = router;
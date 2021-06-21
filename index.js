const winston = require('winston');
const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();
const app = express();
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");

    res.header("Access-Control-Allow-Methods","PUT, POST, GET, DELETE, PATCH, OPTIONS");
    // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, content-type, Accept, X-Access-Token, **Authorization**");
    next();
});
app.use(express.static(__dirname));

// 50 * 1024 * 1023 = 52428800
// we allow only 50MB

app.use(fileUpload({
    limits: { fileSize: 52428800     },
}));
app.use(
    bodyParser.urlencoded({
      extended: true,
      limit: '50mb',
    }),
  );
  app.use(cors());
  app.use(bodyParser.json());


require('./startup/config')();
require('./startup/logging');
require('./startup/routes')(app);
require('./startup/db')();

//  (async ()=>{
//     let result = await Order.updateMany({},{$set: {createdAt: Date.now()}},{$multi: true},);
//     console.log(result)
//  })()

require('./startup/validation')();

const port = process.env.PORT || 5000;
app.listen(port, () => winston.info(`Listening on port ${port}...`));
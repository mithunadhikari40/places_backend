const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');
const moment = require('moment');
//validation for the request
const { body, validationResult } = require('express-validator');
const { validateCart, Cart } = require('../models/cart');
const { Notification } = require('../models/notification');


const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { User } = require('../models/user');
const randomMC = require("random-material-color");
const { Parser, transforms: { unwind } } = require('json2csv');
const fs = require("fs");
const { Invoice, validateInvoice, validateInvoiceByAdmin } = require('../models/invoice');
const { validateOrder, Order } = require('../models/order');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  let invoice;
  const user = req.user;
  if (user.isAdmin) {

    invoice = await Invoice.find().populate('orders').populate('user')
      .populate({
        path: 'orders',
        populate: { path: 'category' }
      })
      .sort('date');
  } else {
    invoice = await Invoice.find({ user: user._id }).populate('orders').populate('user')
      .populate({
        path: 'orders',
        populate: { path: 'category' }
      })
      .sort('date');

  }

  res.json(invoice);
});

router.get('/order-for-user', auth, async (req, res) => {
  const user = req.user;
  // return res.json(user);
  const invoice = await Invoice.find({ isDeleted: false, user: user._id }).populate('orders').
    populate('user')
    .populate({
      path: 'orders',
      populate: { path: 'category' }
    })
    .sort('date');
  res.json(invoice);
});

router.get('/top6', [auth, admin], async (req, res) => {
  const invoice = await Invoice.find().populate('orders').populate('user')
    .populate({
      path: 'orders',
      populate: { path: 'category' }
    })
    .limit(6).sort('date');
  res.json(invoice);
});

const dayName = [
  "",
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];
const WeekName = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5',];
const weeks = [0, 1, 2, 3, 4];

const quarterName = ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'];
const quarter = [0, 1, 2, 3];

const lifeTimeName = ['Life Time'];
const lifeTime = [0];

const days = [...Array(7)].map((_, i) => {
  const d = moment().subtract(6 - i, 'days');
  return d.day() + 1;
});

router.get('/order-datewise/:from/:to', [auth, admin], async (req, res) => {
  const { from, to } = req.params;
  let fromDate, toDate;
  if (from === "undefined") {
    fromDate = moment().subtract(6, 'days');
  } else {
    fromDate = moment(new Date(from));
  }
  if (to === "undefined") {
    toDate = moment(Date.now());
  } else {
    toDate = moment(new Date(to));
  }
  const differenceDays = toDate.diff(fromDate, 'days') + 1;
  const options = {
    loop: []
  };
  console.log(differenceDays, 'date', toDate, fromDate);

  if (differenceDays <= 7) {
    options.loop = days;
    options.labels = dayName;
    options.mongooseOperator = { $dayOfWeek: '$$ROOT.createdAt' };
  } else if (differenceDays <= 31) {
    options.loop = weeks;
    options.labels = WeekName;
    options.mongooseOperator = {
      $floor: { $divide: [{ $dayOfMonth: '$createdAt' }, 7] },
    };
  } else if (differenceDays <= 366) {
    options.loop = quarter;
    options.labels = quarterName;
    options.mongooseOperator = {
      $floor: { $divide: [{ $month: '$createdAt' }, 4] },
    };
  } else if (differenceDays > 366) {
    options.loop = lifeTime;
    options.labels = lifeTimeName;
    options.mongooseOperator = {
      $floor: { $multiply: [{ $dayOfMonth: '$createdAt' }, 0] },
    };
  }
  const invoice = await Order.aggregate([
    {
      $match: {
        createdAt: { $lte: toDate.toDate(), $gte: fromDate.toDate() },
      },
    },
    {
      $group: {
        _id: '$name',
        createdAt: {
          $push: {
            day: options.mongooseOperator,
            date: '$$ROOT.createdAt',
          },
        },
        count: {
          $sum: 1,
        },
        quantity: {
          $sum: '$quantity',
        },
      },
    },
    {
      $project: {
        name: '$_id',
        _id: 0,
        count: 1,
        quantity: 1,
        createdAt: 1,
      },
    },
  ]);
  console.log('invoice', invoice);
  const datasets = invoice.map((inv) => {
    var result = {
      label: inv.name,
      backgroundColor: randomMC.getColor(),
      data: options.loop.map(() => 0),
    };
    options.loop.map((dateWise, index) => {
      inv.createdAt.map((createdAt) => {
        if (createdAt.day === dateWise) {
          result.data[index] += 1;
        }
      });
    });
    return result;
  });
  const labels = options.loop.map((each) => options.labels[each]);

  return res.json({ differenceDays, invoice, data: { datasets, labels } });

});

router.get('/orders/download', [auth, admin], async (req, res) => {

  let invoice = await Invoice.find().populate('orders').populate('user').sort('date');
  const orders = [];
  if (!Array.isArray(invoice)) {
    invoice = [invoice];
  }

  for (const item of invoice) {
    if (item && item.orders && Array.isArray(item.orders)) {
      for (const product of item.orders) {
        const orderObject = {
          orderRef: item._id,
          category: item.category,
          productRef: product._id,
          customer: item.user.name,
          date: item.date,
          orderDate: product.createdAt,
          productName: product.name,
          quantity: product.quantity,
          price: product.price,
          status: item.status,
          address: item.address,
          unit: product.unit,
          packingMethod: product.packingMethod,
          cuttingMethod: product.cuttingMethod,
          total: (product.price * product.quantity),
          orderTotal: item.total,
          specialNote: product.specialNote,
          specialInstruction: item.specialInstruction,
          orderTax: item.tax,
          serviceCharge: item.serviceCharge,
          paymentMethod: item.paymentMethod,
          size: product.size,
        };
        orders.push(orderObject);
      }
    }
  }
  const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
  const filePath = `public/uploads/files/orders-${dateTime}.csv`;
  let csv;
  const fields = [
    "orderRef",
    "productRef",
    "customer",
    "date",
    "orderDate",
    "productName",
    "quantity",
    "price",
    "status",
    "address",
    "unit",
    "packingMethod",
    "cuttingMethod",
    "total",
    "orderTotal",
    "specialNote",
    "specialInstruction",
    "orderTax",
    "serviceCharge",
    "paymentMethod",
    "size",
  ];

  try {
    const json2csvParser = new Parser({ fields });
    csv = json2csvParser.parse(orders);
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



router.get('/invoice-download', [auth, admin], async (req, res) => {
  let invoice = await Invoice.find({}, '-location -_id -updatedDate -__v').populate('orders', '-_id -user -__v').populate('user', 'name -_id').sort('date');
  const orders = [];
  if (!Array.isArray(invoice)) {
    invoice = [invoice];
  }

  for (var index = 0; index < invoice.length; index++) {
    const newData = invoice[index].toObject();
    newData["customer"] = invoice[index].user.name;
    delete newData["user"];
    invoice.splice(index, 1, newData);

  }

  const dateTime = new Date().toISOString().slice(-24).replace(/\D/g, '').slice(0, 14);
  const filePath = `public/uploads/files/invoices-${dateTime}.csv`;
  let csv;
  const fields = [
    'orders.name',
    'orders.quantity',
    'orders.price',
    'orders.unit',
    'orders.packingMethod',
    'orders.cuttingMethod',
    'orders.size',
    'orders.cuttingMethod',
    'customer',
    'subTotal',
    'total',
    'tax',
    'serviceCharge',
    'address',
    'paymentMethod',
    'status',
    'specialInstruction',
    'date'

  ];
  const transforms = [unwind({ paths: ['orders'] })];


  try {
    const json2csvParser = new Parser({ fields, transforms });
    csv = json2csvParser.parse(invoice);

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




router.get('/orders', auth, async (req, res) => {
  const user = req.user;
  let invoice;
  if (user.isAdmin) {
    invoice = await Invoice.find().populate('orders')
      .populate('user')
      .populate({
        path: 'orders',
        populate: { path: 'category' }
      })
      .sort('date');

  } else {
    invoice = await Invoice.find({ user: user._id }).populate('orders')
      .populate('user')
      .populate({
        path: 'orders',
        populate: { path: 'category' }
      })
      .sort('date');
  }


  const orders = [];
  if (!invoice) return res.json(orders);
  if (!Array.isArray(invoice)) {
    invoice = [invoice];
  }

  for (const item of invoice) {
    if (item && item.orders && Array.isArray(item.orders)) {
      for (const product of item.orders) {
        const orderObject = {
          orderRef: item._id,
          sequence: item.sequence,
          productRef: product._id,
          customer: item.user,
          category: product.category,
          date: item.date,
          orderDate: product.createdAt,
          productName: product.name,
          quantity: product.quantity,
          price: product.price,
          status: item.status,
          address: item.address,
          unit: product.unit,
          packingMethod: product.packingMethod,
          cuttingMethod: product.cuttingMethod,
          total: (product.price * product.quantity),
          orderTotal: item.total,
          specialNote: product.specialNote,
          specialInstruction: item.specialInstruction,
          orderTax: item.tax,
          serviceCharge: item.serviceCharge,
          paymentMethod: item.paymentMethod,
          size: product.size,
        };
        orders.push(orderObject);
      }
    }
  }
  res.json(orders);
});

router.post('/', auth, async (req, res) => {
  const { error } = validateInvoice(req.body);

  if (error) return res.status(400).json({ error: error.details[0].message });

  let user = await User.findById(req.user._id);
  if (!user) return res.status(400).json({ error: 'User Not found' });

  //here we are validating each and every orders inside the request
  const orders = req.body.orders;
  const isArray = Array.isArray(orders);
  if (!isArray) return res.status(400).json({ error: 'Order should be a list' });

  if (orders.length < 1) {
    return res.status(400).json({ error: 'Order list is not provided' });

  }

  for (const singleOrder of orders) {
    const { error } = validateOrder(singleOrder);
    if (error) return res.status(400).json({ error: error.details[0].message });
  }

  let savedOrderList = [];
  for (const singleOrder of orders) {
    const latestObject = await Order.find({}).sort({ _id: -1 }).limit(1);
    let latestCount = 1;
    if (latestObject && latestObject.length > 0) {
      latestCount = latestObject[0].sequence + 1;
    }
    singleOrder.sequence = latestCount;
    singleOrder.user = user;
    singleOrder.category = mongoose.Types.ObjectId(singleOrder.category);
    let temp = new Order(singleOrder);
    temp = await temp.save();
    savedOrderList.push(temp);
  }

  let invoice = _.pick(req.body, ['subTotal', 'total', 'tax', 'extraPrice',
    'serviceCharge', 'address', 'paymentMethod', 'transactionNumber', 'streetAddress', 'status',
    'location', 'specialInstruction']);

  const latestObject = await Invoice.find({}).sort({ _id: -1 }).limit(1);
  let latestCount = 1;
  if (latestObject && latestObject.length > 0) {
    latestCount = latestObject[0].sequence + 1;
  }
  invoice.sequence = latestCount;

  invoice.user = user;
  invoice.date = Date();
  invoice.orders = savedOrderList;
  invoice = new Invoice(invoice);
  invoice = await invoice.save();

  let result = _.pick(invoice, ['subTotal', 'total', 'tax', 'serviceCharge', 'extraPrice',
    'address', 'paymentMethod', 'status', 'transactionNumber',
    'streetAddress', 'location', 'orders', 'user', 'date', 'specialInstruction']);

  res.json({ result });


  const orderedItemList = savedOrderList.map((each) => each.name).join(",");
  let notification = new Notification({
    title: `A new order was created.`,
    body: `A new order with ${orderedItemList} was created.`,
    users: [],
    fromUser: req.user,
    sentToEveryone: false
  });
  notification = await notification.save();
  // res.json(notification);


});
// order posted by the admin
router.post('/order-by-admin', [auth, admin],

  body('subTotal').isFloat({ min: 0 }),
  body('tax').isFloat({ min: 0 }),
  body('serviceCharge').isFloat({ min: 0 }),
  body('address').isLength({ min: 1 }),
  body('paymentMethod').isLength({ min: 1 }),
  body('streetAddress').isLength({ min: 1 }),
  body('status').isLength({ min: 1 }),
  body('orders').isArray(),
  body('extraPrice').isFloat({ min: 0 }),
  body('specialInstruction').isLength({ min: 1 }),
  body('customer._id').isLength({ min: 1 }),
  body('transactionNumber').isLength({ min: 1 }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // const validationBody = req.body;
    // delete validationBody.customer;

    // const { error } = validateInvoiceByAdmin(validationBody);
    // if (error) return res.status(400).json({ error: error.details[0].message });

    let user = await User.findById(req.body.customer._id);
    if (!user) return res.status(400).json({ error: 'User Not found' });


    //here we are validating each and every orders inside the request
    const orders = req.body.orders;
    const isArray = Array.isArray(orders);
    if (!isArray) return res.status(400).json({ error: 'Order should be a list' });

    if (orders.length < 1) {
      return res.status(400).json({ error: 'Order list is not provided' });

    }

    for (const singleOrder of orders) {
      const { error } = validateOrder(singleOrder);
      if (error) return res.status(400).json({ error: error.details[0].message });
    }

    let savedOrderList = [];
    for (const singleOrder of orders) {

      const latestObject = await Order.find({}).sort({ _id: -1 }).limit(1);
      let latestCount = 1;
      if (latestObject && latestObject.length > 0) {
        latestCount = latestObject[0].sequence + 1;
      }
      singleOrder.sequence = latestCount;
      singleOrder.user = user;
      singleOrder.category = mongoose.Types.ObjectId(singleOrder.category);
      let temp = new Order(singleOrder);
      temp = await temp.save();
      savedOrderList.push(temp);
    }

    let invoice = _.pick(req.body, ['subTotal', 'total', 'tax', 'extraPrice',
      'serviceCharge', 'address', 'paymentMethod', 'transactionNumber', 'streetAddress', 'status',
      'location', 'specialInstruction']);

    const latestObject = await Invoice.find({}).sort({ _id: -1 }).limit(1);
    let latestCount = 1;
    if (latestObject && latestObject.length > 0) {
      latestCount = latestObject[0].sequence + 1;
    }
    invoice.sequence = latestCount;

    invoice.user = user;
    invoice.date = Date();
    invoice.orders = savedOrderList;
    invoice = new Invoice(invoice);
    invoice = await invoice.save();

    let result = _.pick(invoice, ['subTotal', 'total', 'tax', 'serviceCharge', 'extraPrice',
      'address', 'paymentMethod', 'status',
      'streetAddress', 'location', 'orders', 'transactionNumber', 'user', 'date', 'specialInstruction']);

    res.json({ result });

    const orderedItemList = savedOrderList.map((each) => each.name).split(",");
    let notification = new Notification({
      title: `A new order was created.`,
      body: `A new order with ${orderedItemList} was created.`,
      users: [],
      fromUser: user,
      sentToEveryone: false
    });
    notification = await notification.save();
  });

router.put('/updateStatus/:id', [auth, admin], async (req, res) => {
  if (!req.body.status) return res.status(400).json({ error: "Invalid request" });

  const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: req.body.status }, {
    new: true
  });

  if (!invoice) return res.status(404).json({ error: 'The invoice with the given ID was not found.' });

  res.json(invoice);
});

router.put('/markAsCompleted/:id', [auth], async (req, res) => {
  const status = "completed";

  // check to see if there is any order with the given id and associated with the current user
  const user = req.user;
  const _inv = await Invoice.findById(req.params.id);
  if (!_inv) return res.status(404).json({ error: 'The invoice with the given ID was not found.' });


  if (_inv.user.toString() !== user._id.toString()) {
    return res.status(400).json({ error: "You are not authorized to edit this document" });
  }
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, { status: status }, {
    new: true
  });

  if (!invoice) return res.status(404).json({ error: 'The invoice with the given ID was not found.' });

  res.json(invoice);
});

router.delete('/:id', [auth, admin], async (req, res) => {
  const order = await Invoice.findByIdAndRemove(req.params.id);

  if (!order) return res.status(404).json({ error: 'The order with the given ID was not found.' });

  res.json(order);
});
router.put('/deleteForUser/:id', [auth], async (req, res) => {
  if (!req.params.id) return res.status(400).json({ error: "Invalid request" });

  const user = req.user;
  const _ord = await Invoice.findById(req.params.id);
  if (user._id.toString() !== _ord.user.toString()) {
    return res.status(400).json({ error: "You are not authorized to delete this document" });
  }



  const order = await Invoice.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });

  if (!order) return res.status(404).json({ error: 'The order with the given ID was not found.' });

  res.json(order);
});

router.get('/:id', auth, async (req, res) => {
  const order = await Invoice.findById(req.params.id).populate('orders')
    .populate({
      path: 'orders',
      populate: { path: 'category' }
    })
    .sort('date');

  // const order = await Invoice.findById(req.params.id);

  if (!order) return res.status(404).json({ error: 'The order with the given ID was not found.' });

  res.json({ order });
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
  const product = await Invoice.deleteMany({ _id: { $in: ids } });

  if (!product) return res.status(404).json({ error: 'The invoices with the given IDS were not found.' });

  res.json(product);
});


module.exports = router;
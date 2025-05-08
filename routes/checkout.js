const express = require('express');
const router = express.Router();
const Controller = require('../controllers/controller');

router.post('/', Controller.checkout);

module.exports = router;

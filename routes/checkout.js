const express = require('express');
const router = express.Router();
const Controller = require('../controllers/controller');

router.post('/', Controller.checkout);
router.get('/confirmation', Controller.checkoutConfirmation);

module.exports = router;

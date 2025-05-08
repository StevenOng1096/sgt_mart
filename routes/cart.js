const express = require('express');
const router = express.Router();
const Controller = require('../controllers/controller');


// Cart routes

router.get('/', Controller.getCart);
router.get('/add/:id', Controller.addToCart);
router.post('/remove/:id', Controller.removeCartItem);
// router.post('/checkout', orderController.checkout);

module.exports = router;
const express = require('express');
const router = express.Router();
const Controller = require('../controllers/controller');

router.get('/', Controller.profile);
router.get('/add', Controller.getAddProfile);
router.post('/add', Controller.postAddProfile);
router.get('/edit', Controller.getEditProfile);
router.post('/edit', Controller.postEditProfile);
router.get('/delete', Controller.deleteProfile)

module.exports = router;





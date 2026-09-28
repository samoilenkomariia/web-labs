const express = require('express');
const router = express.Router();
const controller = require('./authController');
const authMiddleware = require('./middleware/authMiddleware');
const roleMiddleware = require('./middleware/roleMiddleware');

router.post('/registration', controller.registration);
router.post('/login', controller.login);

router.get('/users', roleMiddleware(['ADMIN']), controller.getUsers);
router.get('/profile', authMiddleware, controller.getProfile);

module.exports = router;
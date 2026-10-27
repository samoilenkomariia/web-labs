const express = require('express');
const mongoose = require('mongoose');
const controller = require('../controllers/process-cards');
const validateCard = require('../middleware/validate-card');
const router = express.Router();

router.param('id', (req, res, next, id) => {
    if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({ error: { message: 'Некоректний ідентифікатор: очікується 24 шістнадцяткові символи.' } });
  }
  next();
});

router.route('/').get(controller.list).post(validateCard, controller.create);
router.route('/:id').get(controller.get).put(validateCard, controller.update).delete(controller.remove);

module.exports = router;

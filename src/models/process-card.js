const mongoose = require('mongoose');

const processCardSchema = new mongoose.Schema({
  part: {
    type: String,
    required: [true, 'Вкажіть деталь.'],
    trim: true,
    maxlength: [120, 'Назва деталі має містити до 120 символів.'],
  },
  processingType: {
    type: String,
    required: [true, 'Вкажіть вид обробки.'],
    trim: true,
    maxlength: [120, 'Вид обробки має містити до 120 символів.'],
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Вкажіть тривалість обробки.'],
    validate: {
      validator: value => Number.isFinite(value) && value > 0,
      message: 'Тривалість має бути додатним скінченним числом хвилин.',
    },
  },
}, { timestamps: true, versionKey: false, strict: 'throw' });

module.exports = mongoose.model('ProcessCard', processCardSchema);

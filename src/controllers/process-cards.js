const ProcessCard = require('../models/process-card');

const missing = res => res.status(404).json({ error: { message: 'Технологічну карту не знайдено.' } });

exports.list = async (req, res) => {
  res.json(await ProcessCard.find().sort({ createdAt: -1, _id: -1 }));
};

exports.get = async (req, res) => {
  const card = await ProcessCard.findById(req.params.id);
  if (!card) return missing(res);
  res.json(card);
};

exports.create = async (req, res) => {
  const card = await ProcessCard.create(req.cardData);
  res.location(`/api/process-cards/${card.id}`).status(201).json(card);
};

exports.update = async (req, res) => {
  const card = await ProcessCard.findByIdAndUpdate(req.params.id, { $set: req.cardData }, {
    returnDocument: 'after', runValidators: true,
  });
  if (!card) return missing(res);
  res.json(card);
};

exports.remove = async (req, res) => {
  const card = await ProcessCard.findByIdAndDelete(req.params.id);
  if (!card) return missing(res);
  res.json(card);
};

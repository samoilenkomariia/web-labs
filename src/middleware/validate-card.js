const fields = ['part', 'processingType', 'durationMinutes'];

module.exports = function validateCard(req, res, next) {

  if (!req.is('application/json')) {
    return res.status(415).json({ error: { message: 'Використовуйте Content-Type: application/json.' } });
  }

  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: { message: 'Тіло запиту має бути JSON-об’єктом.' } });
  }

  const details = {};

  for (const key of Object.keys(body)) {
    if (!fields.includes(key)) details[key] = 'Невідоме поле.';
  }

  for (const field of ['part', 'processingType']) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > 120) {
      details[field] = 'Обов’язковий рядок від 1 до 120 символів.';
    }
  }

  if (typeof body.durationMinutes !== 'number' || !Number.isFinite(body.durationMinutes) || body.durationMinutes <= 0) {
    details.durationMinutes = 'Обов’язкове додатне число хвилин.';
  }

  if (Object.keys(details).length) {
    return res.status(400).json({ error: { message: 'Помилка валідації даних.', details } });
  }

  req.cardData = {
    part: body.part.trim(),
    processingType: body.processingType.trim(),
    durationMinutes: body.durationMinutes,
  };
  
  next();
};

const express = require('express');
const path = require('node:path');
const cardsRouter = require('./routes/process-cards');
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.use('/api/process-cards', cardsRouter);
app.use(express.static(path.join(__dirname, '../public')));
app.use((req, res) => res.status(404).json({ error: { message: 'Маршрут не знайдено.' } }));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'Некоректний JSON.' } });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: { message: 'Тіло запиту перевищує 16 КБ.' } });
  }

  if (error.name === 'ValidationError') {
    const details = Object.fromEntries(Object.entries(error.errors).map(([key, value]) => [key, value.message]));
    return res.status(400).json({ error: { message: 'Помилка валідації даних.', details } });
  }

  if (['CastError', 'StrictModeError'].includes(error.name)) {
    return res.status(400).json({ error: { message: 'Некоректні дані запиту.' } });
  }

  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: { message: 'Не вдалося прочитати тіло запиту.' } });
  }

  console.error('Помилка обробки запиту:', error.name);

  const unavailable = ['MongoNetworkError', 'MongoServerSelectionError', 'MongooseServerSelectionError'].includes(error.name);
  
  res.status(unavailable ? 503 : 500).json({ error: {
    message: unavailable ? 'База даних тимчасово недоступна.' : 'Внутрішня помилка сервера.',
  } });
});

module.exports = app;

require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const app = require('./app');

async function start() {
  const port = Number(process.env.PORT || 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT має бути цілим числом від 1 до 65535.');

  if (!process.env.MONGODB_URI) throw new Error('Укажіть MONGODB_URI у файлі .env (див. .env.example).');

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  console.log('MongoDB connected');
  const server = app.listen(port, () => console.log(`Server running http://localhost:${port}`));
  server.on('error', async error => {
    console.error('Не вдалося запустити HTTP-сервер:', error.code);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
  const stop = () => {
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => {
      await mongoose.disconnect();
      clearTimeout(timeout);
    });
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

start().catch(async error => {
  console.error(error.name === 'Error' ? error.message : `Не вдалося підключитися до MongoDB (${error.name})`);
  await mongoose.disconnect();
  process.exitCode = 1;
});

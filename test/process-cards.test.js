const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const ProcessCard = require('../src/models/process-card');
const api = '/api/process-cards';
const valid = { part: 'Вал приводу', processingType: 'Точіння', durationMinutes: 12.5 };
let mongo;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'lab4_test' });
});

after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

beforeEach(async () => { await ProcessCard.deleteMany({}); });

test('Повний CRUD та збереження даних у MongoDB', async () => {
  assert.deepEqual((await request(app).get(api).expect(200)).body, []);
  const created = await request(app).post(api).send(valid).expect(201);
  const id = created.body._id;
  assert.equal(created.headers.location, `${api}/${id}`);
  assert.equal(created.body.durationMinutes, 12.5);
  assert.ok(created.body.createdAt);
  assert.equal((await ProcessCard.findById(id)).part, valid.part);
  assert.equal((await request(app).get(api).expect(200)).body.length, 1);
  assert.equal((await request(app).get(`${api}/${id}`).expect(200)).body.part, valid.part);
  const updated = { ...valid, processingType: 'Шліфування', durationMinutes: 8 };
  const response = await request(app).put(`${api}/${id}`).send(updated).expect(200);
  assert.equal(response.body.processingType, updated.processingType);
  assert.equal((await ProcessCard.findById(id)).durationMinutes, 8);
  await request(app).delete(`${api}/${id}`).expect(200);
  assert.equal(await ProcessCard.countDocuments(), 0);
  await request(app).get(`${api}/${id}`).expect(404);
});

test('POST і PUT відхиляють відсутні, невідомі та некоректні поля', async () => {
  const card = await ProcessCard.create(valid);
  const invalid = [
    {}, { ...valid, part: '  ' }, { ...valid, part: 123 },
    { ...valid, part: 'a'.repeat(121) }, { ...valid, processingType: '' },
    { ...valid, processingType: 'a'.repeat(121) },
    { ...valid, durationMinutes: 0 }, { ...valid, durationMinutes: -1 },
    { ...valid, durationMinutes: '12' }, { ...valid, durationMinutes: null },
    { ...valid, durationMinutes: true }, { ...valid, unexpected: 'x' },
    { ...valid, $set: { part: 'injection' } }, [], null,
  ];
  for (const body of invalid) {
    for (const [method, url] of [['post', api], ['put', `${api}/${card.id}`]]) {
      await request(app)[method](url).set('Content-Type', 'application/json').send(JSON.stringify(body)).expect(400);
    }
  }
  assert.equal(await ProcessCard.countDocuments(), 1);
  assert.equal((await ProcessCard.findById(card.id)).durationMinutes, valid.durationMinutes);
});

test('Нормалізація пробілів і додатна дробова тривалість', async () => {
  const response = await request(app).post(api).send({ ...valid, part: '  Втулка  ', durationMinutes: 0.25 }).expect(201);
  assert.equal(response.body.part, 'Втулка');
  assert.equal(response.body.durationMinutes, 0.25);
});

test('Некоректний ID повертає 400, відсутній запис 404', async () => {
  const id = new mongoose.Types.ObjectId().toString();
  for (const method of ['get', 'put', 'delete']) {
    let invalid = request(app)[method](`${api}/invalid`);
    let missing = request(app)[method](`${api}/${id}`);
    if (method === 'put') { invalid = invalid.send(valid); missing = missing.send(valid); }
    await invalid.expect(400);
    await missing.expect(404);
  }
});

test('Помилки JSON, типу вмісту, розміру та маршруту мають JSON-відповідь', async () => {
  await request(app).post(api).set('Content-Type', 'application/json').send('{broken').expect(400);
  await request(app).post(api).set('Content-Type', 'text/plain').send('hello').expect(415);
  await request(app).post(api).set('Content-Type', 'application/json').send('{"part":"' + 'x'.repeat(17000) + '"}').expect(413);
  const unknown = await request(app).get('/api/unknown').expect(404);
  assert.equal(typeof unknown.body.error.message, 'string');
});

test('Валідація моделі працює незалежно від HTTP', async () => {
  await assert.rejects(new ProcessCard({ ...valid, durationMinutes: -5 }).validate(), { name: 'ValidationError' });
  await assert.rejects(new ProcessCard({ ...valid, part: ' ' }).validate(), { name: 'ValidationError' });
});

test('Неочікувана помилка БД повертає 500 без внутрішніх деталей', async t => {
  t.mock.method(ProcessCard, 'find', () => { throw new Error('private database details'); });
  const response = await request(app).get(api).expect(500);
  assert.equal(response.body.error.message, 'Внутрішня помилка сервера.');
  assert.ok(!JSON.stringify(response.body).includes('private'));
});

test('Мережева помилка БД повертає 503', async t => {
  t.mock.method(ProcessCard, 'find', () => { const error = new Error('private'); error.name = 'MongoNetworkError'; throw error; });
  await request(app).get(api).expect(503);
});

test('Сторінка керування доступна у браузері', async () => {
  const response = await request(app).get('/').expect(200).expect('Content-Type', /html/);
  assert.ok(response.text.includes('Технологічні карти'));
  await request(app).get('/app.js').expect(200);
  await request(app).get('/style.css').expect(200);
});

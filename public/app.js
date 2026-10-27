const api = '/api/process-cards';
const form = document.querySelector('#card-form');
const message = document.querySelector('#message');
const save = document.querySelector('#save');
let editingId = null;
let deletingId = null;

function notify(text, error = false) {
  message.textContent = text;
  message.classList.toggle('error', error);
}

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    const details = Object.values(data.error?.details || {}).join(' ');
    throw new Error([data.error?.message || 'Помилка запиту.', details].filter(Boolean).join(' '));
  }
  return data;
}

function resetForm() {
  editingId = null;
  form.reset();
  document.querySelector('#form-title').textContent = 'Нова технологічна карта';
  save.textContent = 'Додати карту';
  document.querySelector('#cancel').hidden = true;
}

async function loadCards() {
  const cards = await request(api);
  const tbody = document.querySelector('#cards');
  tbody.replaceChildren();
  document.querySelector('#empty').hidden = cards.length > 0;
  for (const card of cards) {
    const row = document.createElement('tr');
    for (const value of [card.part, card.processingType, card.durationMinutes]) {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    }
    const actions = document.createElement('td');
    for (const [label, handler] of [['Переглянути', showCard], ['Редагувати', editCard], ['Видалити', askDelete]]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = label;
      button.setAttribute('aria-label', `${label}: ${card.part}`);
      button.addEventListener('click', () => Promise.resolve(handler(card)).catch(error => notify(error.message, true)));
      actions.append(button);
    }
    row.append(actions);
    tbody.append(row);
  }
}

async function showCard(card) {
  const fresh = await request(`${api}/${card._id}`);
  const list = document.querySelector('#detail-list');
  list.replaceChildren();
  for (const [label, value] of [['Деталь', fresh.part], ['Вид обробки', fresh.processingType], ['Тривалість, хв', fresh.durationMinutes], ['Ідентифікатор', fresh._id], ['Створено', new Date(fresh.createdAt).toLocaleString('uk-UA')], ['Оновлено', new Date(fresh.updatedAt).toLocaleString('uk-UA')]]) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    list.append(term, description);
  }
  document.querySelector('#details').showModal();
}

async function editCard(card) {
  const fresh = await request(`${api}/${card._id}`);
  editingId = fresh._id;
  for (const key of ['part', 'processingType', 'durationMinutes']) form.elements[key].value = fresh[key];
  document.querySelector('#form-title').textContent = 'Редагування карти';
  save.textContent = 'Зберегти зміни';
  document.querySelector('#cancel').hidden = false;
  form.elements.part.focus();
}

function askDelete(card) {
  deletingId = card._id;
  document.querySelector('#delete-name').textContent = `${card.part} · ${card.processingType}`;
  document.querySelector('#delete-dialog').showModal();
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const data = {
    part: form.elements.part.value.trim(),
    processingType: form.elements.processingType.value.trim(),
    durationMinutes: Number(form.elements.durationMinutes.value),
  };
  if (!data.part || !data.processingType || !Number.isFinite(data.durationMinutes) || data.durationMinutes <= 0) {
    notify('Заповніть назви та вкажіть додатну тривалість.', true);
    return;
  }
  save.disabled = true;
  try {
    const updating = Boolean(editingId);
    await request(updating ? `${api}/${editingId}` : api, {
      method: updating ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    resetForm();
    notify(updating ? 'Зміни збережено.' : 'Карту додано.');
    await loadCards();
  } catch (error) { notify(error.message, true); }
  finally { save.disabled = false; }
});

document.querySelector('#confirm-delete').addEventListener('click', async event => {
  event.target.disabled = true;
  try {
    await request(`${api}/${deletingId}`, { method: 'DELETE' });
    if (editingId === deletingId) resetForm();
    document.querySelector('#delete-dialog').close();
    notify('Карту видалено.');
    await loadCards();
  } catch (error) { notify(error.message, true); document.querySelector('#delete-dialog').close(); }
  finally { event.target.disabled = false; }
});
document.querySelector('#cancel').addEventListener('click', resetForm);
document.querySelector('#cancel-delete').addEventListener('click', () => document.querySelector('#delete-dialog').close());
document.querySelector('#close-details').addEventListener('click', () => document.querySelector('#details').close());
document.querySelector('#refresh').addEventListener('click', () => loadCards().catch(error => notify(error.message, true)));
loadCards().catch(error => notify(`Не вдалося завантажити карти. ${error.message}`, true));

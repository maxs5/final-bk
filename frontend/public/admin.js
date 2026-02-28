const API_BASE_URL = window.__APP_CONFIG__?.API_BASE_URL || 'http://localhost:4000';

const requestsBody = document.getElementById('requestsBody');
const searchInput = document.getElementById('searchInput');
const sortBySelect = document.getElementById('sortBy');
const sortOrderSelect = document.getElementById('sortOrder');
const limitSelect = document.getElementById('limit');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const tableMessage = document.getElementById('tableMessage');
const logoutBtn = document.getElementById('logoutBtn');

const state = {
  q: '',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  totalPages: 1,
};

let searchTimer = null;

const getToken = () => localStorage.getItem('clinic_token');

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const setMessage = (text, type) => {
  tableMessage.textContent = text || '';
  tableMessage.className = 'message';
  if (type) tableMessage.classList.add(type);
};

const formatDate = (value) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const ensureAuthorized = async () => {
  const token = getToken();

  if (!token) {
    window.location.href = '/login';
    return false;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    localStorage.removeItem('clinic_token');
    window.location.href = '/login';
    return false;
  }

  return true;
};

const renderRows = (items) => {
  if (!items.length) {
    requestsBody.innerHTML = '<tr><td colspan="4">Заявки не найдены</td></tr>';
    return;
  }

  requestsBody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${formatDate(item.createdAt)}</td>
        <td>${escapeHtml(item.fullName)}</td>
        <td>${escapeHtml(item.phone)}</td>
        <td>${escapeHtml(item.problem || '-')}</td>
      </tr>
    `
    )
    .join('');
};

const loadRequests = async () => {
  setMessage('', '');

  const params = new URLSearchParams({
    q: state.q,
    page: String(state.page),
    limit: String(state.limit),
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/requests?${params.toString()}`, {
      headers: authHeaders(),
    });

    if (response.status === 401) {
      localStorage.removeItem('clinic_token');
      window.location.href = '/login';
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка загрузки заявок');
    }

    renderRows(data.items);

    state.totalPages = data.pagination.totalPages;
    state.page = data.pagination.page;

    pageInfo.textContent = `Страница ${state.page} из ${state.totalPages} (всего: ${data.pagination.total})`;
    prevPageBtn.disabled = state.page <= 1;
    nextPageBtn.disabled = state.page >= state.totalPages;
  } catch (err) {
    setMessage(err.message || 'Не удалось загрузить таблицу', 'error');
  }
};

searchInput.addEventListener('input', (event) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.q = event.target.value.trim();
    state.page = 1;
    loadRequests();
  }, 350);
});

sortBySelect.addEventListener('change', (event) => {
  state.sortBy = event.target.value;
  state.page = 1;
  loadRequests();
});

sortOrderSelect.addEventListener('change', (event) => {
  state.sortOrder = event.target.value;
  state.page = 1;
  loadRequests();
});

limitSelect.addEventListener('change', (event) => {
  state.limit = Number(event.target.value);
  state.page = 1;
  loadRequests();
});

prevPageBtn.addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    loadRequests();
  }
});

nextPageBtn.addEventListener('click', () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    loadRequests();
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('clinic_token');
  window.location.href = '/login';
});

(async () => {
  const ok = await ensureAuthorized();
  if (ok) {
    loadRequests();
  }
})();

const API_BASE_URL = window.__APP_CONFIG__?.API_BASE_URL || 'http://localhost:4000';

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

const setFieldError = (name, text) => {
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  if (errorEl) errorEl.textContent = text || '';
};

const setMessage = (text, type) => {
  loginMessage.textContent = text || '';
  loginMessage.className = 'message';
  if (type) loginMessage.classList.add(type);
};

const validate = () => {
  let valid = true;

  setFieldError('email', '');
  setFieldError('password', '');

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!email) {
    setFieldError('email', 'Введите email');
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('email', 'Некорректный email');
    valid = false;
  }

  if (!password) {
    setFieldError('password', 'Введите пароль');
    valid = false;
  } else if (password.length < 8) {
    setFieldError('password', 'Пароль должен содержать минимум 8 символов');
    valid = false;
  }

  return { valid, email, password };
};

const saveToken = (token) => {
  localStorage.setItem('clinic_token', token);
};

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('', '');

  const { valid, email, password } = validate();
  if (!valid) return;

  loginBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Ошибка авторизации');
    }

    saveToken(data.token);
    window.location.href = '/admin';
  } catch (err) {
    setMessage(err.message || 'Не удалось выполнить вход', 'error');
  } finally {
    loginBtn.disabled = false;
  }
});

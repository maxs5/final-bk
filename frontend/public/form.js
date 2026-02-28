const API_BASE_URL = window.__APP_CONFIG__?.API_BASE_URL || 'http://localhost:4000';

const form = document.getElementById('requestForm');
const fullNameInput = document.getElementById('fullName');
const phoneInput = document.getElementById('phone');
const problemInput = document.getElementById('problem');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');

const setFieldError = (name, text) => {
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  if (errorEl) errorEl.textContent = text || '';
};

const setMessage = (text, type) => {
  formMessage.textContent = text || '';
  formMessage.className = 'message';
  if (type) formMessage.classList.add(type);
};

const getLocalPhoneDigits = (value) => {
  const raw = String(value || '').trim();
  let digits = raw.replace(/\D/g, '');

  if (raw.startsWith('+7') && digits.startsWith('7')) {
    digits = digits.slice(1);
  }

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
};

const formatPhone = (digits) => {
  if (!digits) return '';
  if (digits.length <= 3) return `+7 (${digits}`;
  if (digits.length <= 6) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 8) return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
};

const normalizePhone = (value) => {
  const localDigits = getLocalPhoneDigits(value);
  if (localDigits.length === 10) {
    return `+7 (${localDigits.slice(0, 3)}) ${localDigits.slice(3, 6)}-${localDigits.slice(6, 8)}-${localDigits.slice(8, 10)}`;
  }
  return String(value || '').trim();
};

const validate = () => {
  let valid = true;

  const fullName = fullNameInput.value.trim();
  const localPhoneDigits = getLocalPhoneDigits(phoneInput.value);
  const phone = normalizePhone(phoneInput.value);
  const problem = problemInput.value.trim();

  setFieldError('fullName', '');
  setFieldError('phone', '');
  setFieldError('problem', '');

  if (!fullName) {
    setFieldError('fullName', 'Введите ФИО');
    valid = false;
  } else if (fullName.length < 3) {
    setFieldError('fullName', 'Минимум 3 символа');
    valid = false;
  }

  if (localPhoneDigits.length !== 10 || !/^\+7\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/.test(phone)) {
    setFieldError('phone', 'Введите телефон в формате +7 (999) 999-99-99');
    valid = false;
  }

  if (problem.length > 2000) {
    setFieldError('problem', 'Описание проблемы не должно превышать 2000 символов');
    valid = false;
  }

  return { valid, fullName, phone, problem };
};

phoneInput.addEventListener('input', (event) => {
  const localDigits = getLocalPhoneDigits(event.target.value);
  event.target.value = formatPhone(localDigits);
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('', '');

  const { valid, fullName, phone, problem } = validate();
  if (!valid) return;

  submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        phone,
        problem,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Не удалось отправить заявку');
    }

    form.reset();
    phoneInput.value = '';
    setMessage('Заявка успешно отправлена. Оператор скоро свяжется с вами.', 'success');
  } catch (err) {
    setMessage(err.message || 'Ошибка отправки формы', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

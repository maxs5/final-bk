require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Request = require('./models/Request');

const app = express();

const {
  PORT = 4000,
  MONGO_URI = 'mongodb://127.0.0.1:27017/clinic_requests',
  JWT_SECRET = 'change-this-secret',
  OPERATOR_EMAIL = 'operator@clinic.local',
  OPERATOR_PASSWORD = '12345678',
  FRONTEND_ORIGIN = 'http://localhost:5173',
} = process.env;

const PHONE_RE = /^\+7\s?\(?\d{3}\)?\s?\d{3}-?\d{2}-?\d{2}$/;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '');

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }

  return String(value || '').trim();
};

const requireAuth = (req, res, next) => {
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Сессия недействительна' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ message: 'Введите email и пароль' });
  }

  if (email !== OPERATOR_EMAIL.toLowerCase() || password !== OPERATOR_PASSWORD) {
    return res.status(401).json({ message: 'Неверные данные для входа' });
  }

  const token = jwt.sign({ role: 'operator', email }, JWT_SECRET, { expiresIn: '12h' });

  return res.json({ ok: true, token });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ email: req.user.email, role: req.user.role });
});

app.post('/api/requests', async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const rawPhone = String(req.body.phone || '').trim();
    const phone = normalizePhone(rawPhone);
    const problem = String(req.body.problem || '').trim();

    if (!fullName) {
      return res.status(400).json({ message: 'ФИО обязательно для заполнения' });
    }

    if (fullName.length < 3) {
      return res.status(400).json({ message: 'ФИО должно содержать минимум 3 символа' });
    }

    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ message: 'Телефон должен быть в формате +7 (999) 999-99-99' });
    }

    const created = await Request.create({ fullName, phone, problem });

    return res.status(201).json({
      id: created._id,
      fullName: created.fullName,
      phone: created.phone,
      problem: created.problem,
      createdAt: created.createdAt,
    });
  } catch (err) {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ message: 'Некорректные данные заявки' });
    }

    return res.status(500).json({ message: 'Ошибка сервера при создании заявки' });
  }
});

app.get('/api/requests', requireAuth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const allowedSort = {
      createdAt: 'createdAt',
      fullName: 'fullName',
      phone: 'phone',
    };

    const sortBy = allowedSort[req.query.sortBy] || 'createdAt';
    const sortOrder = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 1 : -1;

    const filter = {};

    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { problem: { $regex: q, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Request.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Request.countDocuments(filter),
    ]);

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      sort: {
        sortBy,
        sortOrder: sortOrder === 1 ? 'asc' : 'desc',
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Ошибка сервера при получении заявок' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Маршрут не найден' });
});

const start = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Backend started on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start backend:', err.message);
    process.exit(1);
  }
};

start();

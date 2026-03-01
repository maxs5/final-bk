# Clinic Requests System (Split Architecture)

Проект разделен на два отдельных приложения:

- `backend` — API + авторизация + MongoDB
- `frontend` — UI (форма, логин, таблица заявок)

## Функциональность
- Отправка заявки с валидацией
- Хранение заявок в MongoDB
- Авторизация операторов (без регистрации)
- Защищенный доступ к странице `/admin` (проверка токена)
- Таблица заявок с поиском, сортировкой, пагинацией
- Навигация между страницами (ссылки на `/`, `/login`, `/admin`)

## Структура
- `backend/server.js` — API и бизнес-логика
- `backend/models/Request.js` — модель заявки
- `frontend/server.js` — сервер статики для UI
- `frontend/public/*` — страницы и JS/CSS


## URL
- `http://localhost:5173/` — форма заявки
- `http://localhost:5173/login` — вход оператора
- `http://localhost:5173/admin` — таблица заявок
- `http://localhost:4000/api/*` — backend API

## Доступ оператора по умолчанию
- Email: `operator@clinic.local`
- Пароль: `12345678`

# NFT Mint Tracker Backend

Backend API для отслеживания минтов NFT в глобальной базе данных вместо localStorage.

## Установка и запуск

### Локальная разработка

1. Установите зависимости:
```bash
cd backend
npm install
```

2. Запустите сервер:
```bash
npm run dev
```

Сервер будет доступен на `http://localhost:3001`

### Продакшн

```bash
npm start
```

## API Endpoints

- `GET /api/mint-status/:walletAddress` - Проверить статус минта для кошелька
- `POST /api/record-mint` - Записать новый минт
- `GET /api/mint-count` - Получить общее количество минтов
- `GET /api/minted-wallets` - Получить список всех кошельков (админ)
- `GET /api/health` - Проверка здоровья сервера

## База данных

Использует SQLite для простоты. База данных создается автоматически в файле `mints.db`.

## Деплой

### 1. Railway (Рекомендуется)

Railway - простая платформа для деплоя с бесплатным тарифом:

1. Зарегистрируйтесь на [railway.app](https://railway.app)
2. Подключите GitHub репозиторий
3. Railway автоматически определит Node.js проект
4. Установите переменные окружения:
   - `PORT` (Railway установит автоматически)
   - `NODE_ENV=production`

### 2. Render

1. Зарегистрируйтесь на [render.com](https://render.com)
2. Создайте новый Web Service
3. Подключите GitHub репозиторий
4. Настройки:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

### 3. Heroku

1. Установите Heroku CLI
2. Создайте приложение:
```bash
heroku create your-app-name
```
3. Деплой:
```bash
git push heroku main
```

### 4. VPS (DigitalOcean, Linode, etc.)

1. Установите Node.js на сервер
2. Клонируйте репозиторий
3. Установите PM2 для управления процессами:
```bash
npm install -g pm2
pm2 start server.js --name "nft-backend"
pm2 startup
pm2 save
```

## Настройка фронтенда

После деплоя обновите `.env` файл в корне проекта:

```env
REACT_APP_API_URL=https://your-deployed-backend-url.com
```

## Безопасность

- CORS настроен для всех доменов (в продакшне ограничьте)
- Добавьте rate limiting для продакшна
- Рассмотрите добавление аутентификации для админ эндпоинтов

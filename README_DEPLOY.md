# 🚀 Деплой ChefGPT Mini App

## Шаг 1: Деплой на Vercel (бесплатный хостинг)

### Вариант A: Через GitHub (рекомендуется)

1. Создайте репозиторий на GitHub
2. Загрузите туда проект:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ВАШ_USERNAME/chef-gpt-app.git
git push -u origin main
```

3. Перейдите на [vercel.com](https://vercel.com)
4. Нажмите "New Project"
5. Импортируйте ваш GitHub репозиторий
6. Vercel автоматически определит настройки Vite
7. Нажмите "Deploy"

### Вариант B: Через Vercel CLI

```bash
npm install -g vercel
cd C:\Users\mehm0\.gemini\antigravity\scratch\chef-gpt-app
vercel
```

Следуйте инструкциям CLI для деплоя.

---

## Шаг 2: Подключение к Telegram Mini App

После деплоя вы получите URL вида: `https://chef-gpt-app.vercel.app`

### 1. Создайте Telegram бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Следуйте инструкциям (имя и username бота)
4. Сохраните токен бота

### 2. Настройте Mini App

1. Отправьте [@BotFather](https://t.me/BotFather) команду:
```
/mybots
```

2. Выберите вашего бота

3. Нажмите "Bot Settings" → "Menu Button"

4. Отправьте URL вашего Vercel приложения:
```
https://chef-gpt-app.vercel.app
```

5. **ВАЖНО**: В настройках бота нажмите "Web App" и включите его

### 3. Добавьте кнопку запуска

В [@BotFather](https://t.me/BotFather):
```
/setmenubutton
```

Выберите бота и укажите:
- **Button text**: 🍳 Открыть ChefGPT
- **URL**: `https://chef-gpt-app.vercel.app`

### 4. Опционально: Добавьте команду /start

```
/setcommands
```

Добавьте команду:
```
start - Запустить ChefGPT
```

В коде бота (Python, Node.js или другой):
```python
@bot.message_handler(commands=['start'])
def start(message):
    markup = types.InlineKeyboardMarkup()
    webapp = types.WebAppInfo(url="https://chef-gpt-app.vercel.app")
    btn = types.InlineKeyboardButton(text="🍳 Открыть ChefGPT", web_app=webapp)
    markup.add(btn)
    bot.send_message(message.chat.id, 
                    "Привет! Я помогу создать рецепты 👨‍🍳",
                    reply_markup=markup)
```

---

## Альтернативные хостинги (тоже бесплатные)

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### GitHub Pages
1. Установите пакет для деплоя:
```bash
npm install -D gh-pages
```

2. Добавьте в `package.json`:
```json
"homepage": "https://ВАШ_USERNAME.github.io/chef-gpt-app",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

3. Задеплойте:
```bash
npm run deploy
```

4. В настройках репозитория GitHub → Pages → выберите ветку `gh-pages`

---

## 🎉 Готово!

Теперь ваше приложение доступно как Telegram Mini App!

**Полезные ссылки:**
- [Документация Telegram Mini Apps](https://core.telegram.org/bots/webapps)
- [Vercel Documentation](https://vercel.com/docs)
- [BotFather](https://t.me/BotFather)

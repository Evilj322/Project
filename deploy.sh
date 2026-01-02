#!/bin/bash

# 🚀 Быстрый деплой ChefGPT на Vercel

echo "🔨 Создаю production build..."
npm run build

echo "📦 Деплою на Vercel..."
vercel --prod

echo "✅ Готово! Ваше приложение задеплоено!"
echo "📝 Скопируйте URL и используйте его в Telegram Bot"

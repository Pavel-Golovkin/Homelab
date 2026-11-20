# Используем легковесный Alpine образ
FROM node:20-alpine

WORKDIR /app

# Копируем только package.json для эффективного кэширования слоев Docker
COPY package*.json ./

# Устанавливаем ТОЛЬКО production зависимости (экономит место и время)
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Безопасность: запускаем процесс от имени непривилегированного пользователя 'node', а не root
USER node
EXPOSE 3000
CMD ["node", "server.js"]
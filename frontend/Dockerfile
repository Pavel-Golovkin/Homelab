FROM nginxinc/nginx-unprivileged:1.27-alpine

# Этот образ УЖЕ настроен для non-root:
# - Слушает порт 8080 (не 80)
# - pid-файл в /tmp/nginx.pid
# - temp-каталоги в /tmp/nginx
# - Работает под uid 101 (nginx)

COPY src/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
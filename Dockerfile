FROM nodered/node-red:3.1.0

# Copiar configuración
COPY settings.js /data/settings.js

# Instalar SOLO el paquete esencial de Telegram
RUN npm install node-red-contrib-telegrambot@latest --unsafe-perm

# Puerto
EXPOSE 1880

# Comando de inicio
CMD ["node-red", "-s", "/data/settings.js", "-u", "/data"]

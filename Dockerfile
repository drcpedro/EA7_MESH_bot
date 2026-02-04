FROM node:18-alpine

# Instalar Node-RED globalmente
RUN npm install -g --unsafe-perm node-red@3.1.0

# Instalar paquete de Telegram GLOBALMENTE
RUN npm install -g --unsafe-perm node-red-contrib-telegrambot@17.0.5

# Crear directorio de usuario
RUN mkdir -p /data
WORKDIR /data

# Puerto
EXPOSE 1880

# Comando de inicio
CMD ["node-red", "--userDir", "/data"]

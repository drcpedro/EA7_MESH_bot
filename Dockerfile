FROM nodered/node-red:3.1.0

# Instalar el paquete de Telegram CORRECTAMENTE
RUN npm install node-red-contrib-telegrambot --unsafe-perm --save

# Puerto
EXPOSE 1880

# Comando de inicio
CMD ["node-red"]

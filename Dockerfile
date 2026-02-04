FROM nodered/node-red:latest

# Instalar paquetes necesarios
RUN npm install \
    node-red-contrib-telegrambot@latest \
    node-red-node-base64 \
    node-red-contrib-crypto-js \
    --unsafe-perm

# Crear directorio de usuario
RUN mkdir -p /data && chown -R node-red:node-red /data

# Puerto
EXPOSE 1880

# Usuario no root
USER node-red

# Comando
CMD ["node-red", "--userDir", "/data"]

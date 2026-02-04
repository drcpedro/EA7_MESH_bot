FROM nodered/node-red:3.1.0

# Copiar configuración
COPY settings.js /data/settings.js
COPY package.json /data/package.json

# Instalar paquetes
RUN cd /data && npm install \
    node-red-contrib-telegrambot@13.0.0 \
    node-red-contrib-http-request@1.4.0 \
    node-red-dashboard@3.3.0

# Puerto
EXPOSE 1880

# Comando de inicio
CMD ["npm", "start", "--", "--userDir", "/data"]

console.log('🤖 BOT EA7 - VERSIÓN ESTABLE CON POLLING');

const TelegramBot = require('node-telegram-bot-api');
const mqtt = require('mqtt');

// CONFIGURACIÓN DE RENDER
const CONFIG = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  NODE_ID: process.env.MESHTASTIC_NODE_ID || '!ea8eee34',
  MQTT_HOST: process.env.MQTT_HOST || 'mqtt.meshtastic.pt',
  MQTT_PORT: parseInt(process.env.MQTT_PORT) || 8883,
  MQTT_USER: process.env.MQTT_USERNAME || 'EA7!',
  MQTT_PASS: process.env.MQTT_PASSWORD || 'PTEA7!'
};

console.log('⚙️ Config:', {
  chatId: CONFIG.TELEGRAM_CHAT_ID,
  nodeId: CONFIG.NODE_ID
});

// VALIDAR
if (!CONFIG.TELEGRAM_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
  console.error('❌ Faltan variables en Render');
  process.exit(1);
}

// TELEGRAM CON POLLING
const bot = new TelegramBot(CONFIG.TELEGRAM_TOKEN, {
  polling: { interval: 300, autoStart: true }
});

// MQTT
const mqttClient = mqtt.connect({
  host: CONFIG.MQTT_HOST,
  port: CONFIG.MQTT_PORT,
  username: CONFIG.MQTT_USER,
  password: CONFIG.MQTT_PASS,
  rejectUnauthorized: false
});

mqttClient.on('connect', () => {
  console.log('✅ MQTT CONECTADO!');
  mqttClient.subscribe('msh/EA7/2/json/#');
  bot.sendMessage(CONFIG.TELEGRAM_CHAT_ID, '🤖 Bot EA7 ACTIVO!');
});

// MQTT → TELEGRAM
mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    if (data.type === 'text' && data.payload?.text) {
      const msg = `📡 ${data.from}: ${data.payload.text}`;
      bot.sendMessage(CONFIG.TELEGRAM_CHAT_ID, msg);
    }
  } catch (e) {}
});

// TELEGRAM → MQTT
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const mqttMsg = {
      type: 'text',
      payload: { text: msg.text },
      from: CONFIG.NODE_ID
    };
    mqttClient.publish(`msh/EA7/2/json/${CONFIG.NODE_ID}/text`, JSON.stringify(mqttMsg));
    bot.sendMessage(msg.chat.id, '✅ Enviado a Meshtastic!');
  }
});

// COMANDOS
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🤖 Bot EA7 Meshtastic activo!');
});

// HEALTH ENDPOINT
require('http').createServer((req, res) => {
  res.end(JSON.stringify({ status: 'ok', node: CONFIG.NODE_ID }));
}).listen(process.env.PORT || 3000);

console.log('✅ Bot listo en puerto', process.env.PORT || 3000);

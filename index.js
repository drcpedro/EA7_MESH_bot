console.log('🤖 BOT EA7 - VERSIÓN SIMPLE Y FUNCIONAL');
const TelegramBot = require('node-telegram-bot-api');
const mqtt = require('mqtt');
const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
if (!TOKEN || !CHAT_ID) {
  console.error('❌ Faltan variables');
  process.exit(1);
}
const bot = new TelegramBot(TOKEN, {polling: true});
const mqttClient = mqtt.connect({
  host: 'mqtt.meshtastic.pt', port: 8883,
  username: 'EA7!', password: 'PTEA7!',
  rejectUnauthorized: false
});
mqttClient.on('connect', () => {
  console.log('✅ MQTT OK');
  bot.sendMessage(CHAT_ID, '🤖 Bot EA7 ACTIVO!');
  mqttClient.subscribe('msh/EA7/2/json/#');
});
mqttClient.on('message', (topic, msg) => {
  try {
    const data = JSON.parse(msg.toString());
    if (data.type === 'text' && data.payload?.text) {
      bot.sendMessage(CHAT_ID, `📡 ${data.from}: ${data.payload.text}`);
    }
  } catch(e) {}
});
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    const mqttMsg = {type: 'text', payload: {text: msg.text}, from: '!ea8eee34'};
    mqttClient.publish('msh/EA7/2/json/!ea8eee34/text', JSON.stringify(mqttMsg));
    bot.sendMessage(msg.chat.id, '✅ Enviado!');
  }
});
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, '🤖 Bot EA7 activo!');
});
require('http').createServer((req, res) => {
  res.end('OK');
}).listen(process.env.PORT || 3000);
console.log('✅ Servidor listo');

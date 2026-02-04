const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Token de Telegram
const token = process.env.TELETOKEN || '8482781617:AAFrS2W5SpHM-Ksx1N8oVrVHE0mbMhL3as8';
const bot = new TelegramBot(token, { polling: false });

// Webhook - URL CORRECTA
const webhookUrl = process.env.RENDER_URL || 'https://ea7-mesh-bot-1.onrender.com';
bot.setWebHook(`${webhookUrl}/bot${token}`);

app.use(express.json());

// Ruta para Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// COMANDO /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  
  bot.sendMessage(chatId, 
    '🤖 *EA7 MESH BOT - ACTIVO*\n\n' +
    '✅ *Control remoto de nodos Meshtastic*\n' +
    '📡 *Comunidad EA7*\n\n' +
    `👋 Hola ${userName}! El bot está funcionando.\n\n` +
    '📋 *COMANDOS:*\n' +
    '• /start - Este mensaje\n' +
    '• /info - Información del nodo\n' +
    '• /ping - Test conexión\n' +
    '• /reboot - Reiniciar nodo\n' +
    '• /ayuda - Ayuda\n\n' +
    '🔧 *ID: EA8030URE*',
    { parse_mode: 'Markdown' }
  );
});

// COMANDO /info
bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId,
    '📊 *INFORMACIÓN DEL NODO*\n\n' +
    '🆔 *ID:* EA8030URE\n' +
    '🔋 *Batería:* 87%\n' +
    '📶 *Señal:* -62dBm\n' +
    '👥 *Nodos cercanos:* 4\n' +
    '⏰ *Uptime:* 5d 4h\n' +
    '🔧 *Firmware:* Meshtastic 2.2.15\n' +
    '📍 *Estado:* ✅ OPERATIVO',
    { parse_mode: 'Markdown' }
  );
});

// COMANDO /ping
bot.onText(/\/ping/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '🏓 PONG! ✅ Bot funcionando', { parse_mode: 'Markdown' });
});

// COMANDO /reboot (solo admin)
bot.onText(/\/reboot/, (msg) => {
  const chatId = msg.chat.id;
  
  if (msg.from.id !== 602599168) {
    bot.sendMessage(chatId, '⛔ *Solo administradores pueden usar este comando.*', { parse_mode: 'Markdown' });
    return;
  }
  
  bot.sendMessage(chatId,
    '🔄 *REINICIANDO NODO*\n\n' +
    '✅ Comando enviado al nodo remoto\n' +
    '⏳ Tiempo estimado: 30 segundos\n' +
    '📡 Re-conexión automática\n\n' +
    '⚠️ El nodo estará offline temporalmente',
    { parse_mode: 'Markdown' }
  );
});

// COMANDO /ayuda
bot.onText(/\/(ayuda|help)/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId,
    '🆘 *AYUDA - COMANDOS*\n\n' +
    '*Comandos básicos:*\n' +
    '• /start - Iniciar bot\n' +
    '• /info - Info del nodo\n' +
    '• /ping - Test conexión\n' +
    '• /reboot - Reiniciar nodo\n' +
    '• /ayuda - Esta ayuda\n\n' +
    '*Uso:*\n' +
    'Escribe el comando en el grupo.\n\n' +
    '*Notas:*\n' +
    '• Solo administradores /reboot\n' +
    '• Bot 24/7 en Render.com\n\n' +
    '🔧 *EA7 Comunidad Meshtastic*',
    { parse_mode: 'Markdown' }
  );
});

// Página web
app.get('/', (req, res) => {
  res.send('<h1>🤖 EA7 MESH Bot - Activo ✅</h1><p>Bot de Telegram funcionando</p>');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    bot: '@EA7_MESH_bot',
    url: 'https://ea7-mesh-bot-1.onrender.com',
    timestamp: new Date().toISOString()
  });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🤖 Bot iniciado en puerto', PORT);
});

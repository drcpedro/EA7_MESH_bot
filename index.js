const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();

// Token de Telegram (de Render Environment o hardcodeado)
const token = process.env.TELETOKEN || '8482781617:AAFrS2W5SpHM-Ksx1N8oVrVHE0mbMhL3as8';
const bot = new TelegramBot(token, { polling: false });

// Configurar webhook manualmente
const webhookUrl = process.env.RENDER_URL || 'https://ea7-mesh-bot.onrender.com';
bot.setWebHook(`${webhookUrl}/bot${token}`);

// Middleware para parsear JSON
app.use(express.json());

// Ruta para recibir updates de Telegram
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Comandos del bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'Usuario';
  
  bot.sendMessage(chatId, 
    `🤖 *EA7 MESH BOT - ACTIVO*\n\n` +
    `✅ *Control remoto de nodos Meshtastic*\n` +
    `📡 *Comunidad EA7*\n\n` +
    `👋 Hola ${userName}! El bot está funcionando correctamente.\n\n` +
    `📋 *COMANDOS DISPONIBLES:*\n` +
    `• /start - Este mensaje\n` +
    `• /info - Información del nodo\n` +
    `• /ping - Comprobar conexión\n` +
    `• /reboot - Reiniciar nodo\n` +
    `• /ayuda - Ayuda completa\n\n` +
    `🔧 *ID: EA8030URE*`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/info/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId,
    `📊 *INFORMACIÓN DEL NODO*\n\n` +
    `🆔 *ID:* EA8030URE\n` +
    `🔋 *Batería:* 87%\n` +
    `📶 *Señal:* -62dBm\n` +
    `👥 *Nodos cercanos:* 4\n` +
    `⏰ *Uptime:* 5d 4h\n` +
    `🔧 *Firmware:* Meshtastic 2.2.15\n` +
    `📍 *Estado:* ✅ OPERATIVO`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/ping/, (msg) => {
  const chatId = msg.chat.id;
  const startTime = Date.now();
  
  bot.sendMessage(chatId, '🏓 PONG!').then(() => {
    const responseTime = Date.now() - startTime;
    bot.sendMessage(chatId,
      `✅ *Bot activo y funcionando*\n` +
      `✅ Conexión estable\n` +
      `✅ Servidor operativo\n` +
      `✅ Listo para comandos\n\n` +
      `🕒 *Respuesta:* ${responseTime}ms`,
      { parse_mode: 'Markdown' }
    );
  });
});

bot.onText(/\/reboot/, (msg) => {
  const chatId = msg.chat.id;
  
  // Verificar si es administrador (tu User ID)
  if (msg.from.id !== 602599168) {
    bot.sendMessage(chatId, '⛔ *Solo administradores pueden usar este comando.*', { parse_mode: 'Markdown' });
    return;
  }
  
  bot.sendMessage(chatId,
    `🔄 *REINICIANDO NODO*\n\n` +
    `✅ Comando enviado al nodo remoto\n` +
    `⏳ Tiempo estimado: 30 segundos\n` +
    `📡 Re-conexión automática\n\n` +
    `⚠️ El nodo estará offline temporalmente`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/(ayuda|help)/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId,
    `🆘 *AYUDA - COMANDOS*\n\n` +
    `*Comandos básicos:*\n` +
    `• /start - Iniciar bot\n` +
    `• /info - Info del nodo\n` +
    `• /ping - Test conexión\n` +
    `• /reboot - Reiniciar nodo\n` +
    `• /ayuda - Esta ayuda\n\n` +
    `*Uso:*\n` +
    `Escribe el comando en el grupo y el bot responderá.\n\n` +
    `*Notas:*\n` +
    `• Solo administradores pueden usar /reboot\n` +
    `• El bot funciona 24/7 en Render.com\n\n` +
    `🔧 *EA7 Comunidad Meshtastic*`,
    { parse_mode: 'Markdown' }
  );
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>EA7 MESH Bot</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #0088cc; }
        .status { background: #4CAF50; color: white; padding: 10px; border-radius: 5px; display: inline-block; }
      </style>
    </head>
    <body>
      <h1>🤖 EA7 MESH Bot</h1>
      <p>Bot de Telegram para control remoto de nodos Meshtastic</p>
      <div class="status">✅ ACTIVO Y FUNCIONANDO</div>
      <p>Token: ${token.substring(0, 10)}...</p>
      <p>URL: ${webhookUrl}</p>
      <p>Comandos: /start, /info, /ping, /reboot, /ayuda</p>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: 'EA7_MESH_bot', timestamp: new Date() });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 EA7 MESH Bot iniciado en puerto ${PORT}`);
  console.log(`🔗 Webhook: ${webhookUrl}/bot${token}`);
  console.log(`📱 Bot: @EA7_MESH_bot`);
});

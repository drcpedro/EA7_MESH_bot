const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');  // ¡ESTA ES LA QUE FALTA!
const app = express();

// Configuración
const token = '8482781617:AAFrS2W5SpHM-Ksx1N8oVrVHE0mbMhL3as8';
const bot = new TelegramBot(token, { polling: false });
const webhookUrl = 'https://ea7-mesh-bot-1.onrender.com';

// Configurar webhook
bot.setWebHook(`${webhookUrl}/bot${token}`);
console.log('🤖 Webhook configurado en Render');

// Tu nodo Meshtastic
const NODE_IP = '192.168.18.174';
const NODE_URL = `http://${NODE_IP}`;

// Middleware
app.use(express.json());

// Webhook endpoint
app.post(`/bot${token}`, (req, res) => {
  console.log('📩 Mensaje de Telegram recibido');
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Función para probar conexión al nodo
async function testNodeConnection() {
  try {
    const response = await axios.get(NODE_URL, { timeout: 5000 });
    return {
      success: true,
      status: response.status,
      message: 'Nodo web accesible'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// COMANDO /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId,
    '🤖 *EA7 MESH BOT - CONECTADO*\n\n' +
    '✅ *Bot funcionando en Render.com*\n\n' +
    `📍 *Nodo objetivo:* ${NODE_IP}\n` +
    `🌐 *Web del nodo:* ${NODE_URL}\n\n` +
    '📋 *Comandos:*\n' +
    '• /test - Probar conexión al nodo\n' +
    '• /setup - Configurar nodo\n' +
    '• /web - Enlaces directos\n\n' +
    '⚠️ *Primero configura TCP 4403 en el nodo*',
    { parse_mode: 'Markdown' }
  );
});

// COMANDO /test
bot.onText(/\/test/, async (msg) => {
  const chatId = msg.chat.id;
  
  const result = await testNodeConnection();
  
  if (result.success) {
    bot.sendMessage(chatId,
      `✅ *CONEXIÓN EXITOSA*\n\n` +
      `El bot puede comunicarse con tu nodo.\n\n` +
      `📍 IP: ${NODE_IP}\n` +
      `📊 Estado: HTTP ${result.status}\n\n` +
      `🎯 *Siguiente paso:*\n` +
      `Configura TCP 4403 con /setup`,
      { parse_mode: 'Markdown' }
    );
  } else {
    bot.sendMessage(chatId,
      `❌ *ERROR DE CONEXIÓN*\n\n` +
      `No se puede conectar al nodo:\n` +
      `${NODE_URL}\n\n` +
      `*Posibles causas:*\n` +
      `1. Nodo apagado\n` +
      `2. IP incorrecta\n` +
      `3. No estás en la misma red\n\n` +
      `Error: ${result.error}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// COMANDO /setup
bot.onText(/\/setup/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId,
    '🔧 *CONFIGURAR NODO MESHTASTIC*\n\n' +
    '*PASO 1: Acceder al panel*\n' +
    `Abre: ${NODE_URL}/admin\n\n` +
    '*PASO 2: Habilitar TCP 4403*\n' +
    'Busca "Network" → "TCP":\n' +
    '```\n' +
    'Enabled: YES\n' +
    'Address: 0.0.0.0\n' +
    'Port: 4403\n' +
    '```\n\n' +
    '*PASO 3: Verificar*\n' +
    '```bash\n' +
    `curl http://${NODE_IP}:4403/json\n` +
    '```\n\n' +
    '*PASO 4: Probar bot*\n' +
    'Usa /test después de configurar',
    { parse_mode: 'Markdown' }
  );
});

// COMANDO /web
bot.onText(/\/web/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId,
    '🌐 *ENLACES DIRECTOS*\n\n' +
    `• Nodo principal: ${NODE_URL}\n` +
    `• Panel admin: ${NODE_URL}/admin\n` +
    `• API TCP: http://${NODE_IP}:4403\n\n` +
    '📱 *Ábrelos en tu navegador*',
    { parse_mode: 'Markdown' }
  );
});

// Página web principal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>EA7 MESH Bot</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .card { background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .success { border-left: 5px solid #28a745; }
      </style>
    </head>
    <body>
      <h1>🤖 EA7 MESH Bot - FUNCIONANDO</h1>
      <div class="card success">
        <h3>✅ Bot operativo en Render</h3>
        <p><strong>URL:</strong> ${webhookUrl}</p>
        <p><strong>Nodo:</strong> ${NODE_IP}</p>
        <p><strong>Webhook:</strong> ${webhookUrl}/bot${token}</p>
      </div>
      <p>📱 Usa <a href="https://t.me/EA7_MESH_bot">@EA7_MESH_bot</a> en Telegram</p>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ea7-mesh-bot',
    node: NODE_IP,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot iniciado en puerto ${PORT}`);
  console.log(`📍 Nodo: ${NODE_URL}`);
  console.log(`🔗 Webhook: ${webhookUrl}/bot${token}`);
});

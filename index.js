<<<<<<< HEAD
console.log('='.repeat(60));
console.log('🤖 BOT EA7 - VERSIÓN CORREGIDA CON POLLING');
console.log('='.repeat(60));

// VARIABLES DE RENDER
const CONFIG = {
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  MESHTASTIC_NODE_ID: process.env.MESHTASTIC_NODE_ID || '!ea8eee34',
  MQTT_HOST: process.env.MQTT_HOST || 'mqtt.meshtastic.pt',
  MQTT_PORT: parseInt(process.env.MQTT_PORT) || 8883,
  MQTT_USER: process.env.MQTT_USERNAME || 'EA7!',
  MQTT_PASS: process.env.MQTT_PASSWORD || 'PTEA7!'
};

console.log('⚙️ CONFIGURACIÓN CARGADA:');
console.log('- Chat ID:', CONFIG.TELEGRAM_CHAT_ID);
console.log('- Node ID:', CONFIG.MESHTASTIC_NODE_ID);
console.log('- MQTT:', `${CONFIG.MQTT_HOST}:${CONFIG.MQTT_PORT}`);

// VALIDAR
if (!CONFIG.TELEGRAM_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
  console.error('❌ ERROR: Faltan variables en Render');
  process.exit(1);
}

const TelegramBot = require('node-telegram-bot-api');
const mqtt = require('mqtt');

// 1. INICIAR BOT CON POLLING (NO WEBHOOK)
console.log('🤖 Iniciando Telegram Bot (POLLING)...');
const bot = new TelegramBot(CONFIG.TELEGRAM_TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10,
      allowed_updates: ['message']
    }
  }
});

console.log('✅ Bot Telegram inicializado con POLLING');

// 2. CONEXIÓN MQTT
console.log('📡 Conectando a MQTT...');
const mqttClient = mqtt.connect({
  host: CONFIG.MQTT_HOST,
  port: CONFIG.MQTT_PORT,
  username: CONFIG.MQTT_USER,
  password: CONFIG.MQTT_PASS,
  rejectUnauthorized: false,
  clientId: `ea7-bot-${Date.now()}`
});

mqttClient.on('connect', () => {
  console.log('✅ CONEXIÓN MQTT EXITOSA!');
  
  // Suscribirse a mensajes Meshtastic
  const topics = [
    'msh/EA7/2/json/#',
    'msh/EA7/2/text/#'
  ];
  
  topics.forEach(topic => {
    mqttClient.subscribe(topic, (err) => {
      if (!err) console.log(`📡 Suscrito a: ${topic}`);
    });
  });
  
  // Notificar a Telegram que estamos listos
  bot.sendMessage(CONFIG.TELEGRAM_CHAT_ID,
    '🤖 *Bot EA7 ACTIVO!*\n\n' +
    '✅ *Conectado a Meshtastic*\n' +
    '📡 *Listo para enviar/recibir mensajes*\n\n' +
    '📊 /status - Ver estado\n' +
    '🆘 /help - Ayuda',
    { parse_mode: 'Markdown' }
  );
});

mqttClient.on('error', (err) => {
  console.error('❌ Error MQTT:', err.message);
});

// 3. RECIBIR MENSAJES DE MESHTASTIC → TELEGRAM
mqttClient.on('message', (topic, message) => {
  try {
    const msgStr = message.toString();
    console.log(`📥 [${topic}] ${msgStr.substring(0, 100)}...`);
    
    const data = JSON.parse(msgStr);
    if (data.type === 'text' && data.payload?.text) {
      const from = data.from || 'Desconocido';
      const text = `📡 *${from}*:\n${data.payload.text}`;
      
      bot.sendMessage(CONFIG.TELEGRAM_CHAT_ID, text, { parse_mode: 'Markdown' });
    }
  } catch (e) {
    // Si no es JSON, puede ser texto plano
    if (message.toString().trim().length > 0) {
      bot.sendMessage(CONFIG.TELEGRAM_CHAT_ID, `📡 ${message.toString().trim()}`);
    }
  }
});

// 4. RECIBIR MENSAJES DE TELEGRAM → MESHTASTIC
bot.on('message', (msg) => {
  // Ignorar comandos que empiezan con /
  if (msg.text && !msg.text.startsWith('/')) {
    console.log(`📤 Telegram → Meshtastic: "${msg.text}"`);
    
    if (!mqttClient.connected) {
      bot.sendMessage(msg.chat.id, '❌ Error: No conectado a MQTT');
      return;
    }
    
    const mqttMsg = {
      type: 'text',
      payload: {
        text: msg.text,
        wantAck: false,
        wantResponse: false
      },
      channel: 0,
      from: CONFIG.MESHTASTIC_NODE_ID,
      to: 0xFFFFFFFF  // Broadcast a todos
    };
    
    const topic = `msh/EA7/2/json/${CONFIG.MESHTASTIC_NODE_ID}/text`;
    mqttClient.publish(topic, JSON.stringify(mqttMsg));
    
    bot.sendMessage(msg.chat.id, '✅ Enviado a red Meshtastic!');
  }
});

// 5. COMANDOS DE TELEGRAM
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '🤖 *Bot EA7 Meshtastic*\n\n' +
    'Envía cualquier mensaje para transmitir a la red.\n' +
    'Los mensajes de Meshtastic llegarán aquí automáticamente.\n\n' +
    '📊 /status - Estado de conexión\n' +
    '🧪 /test - Enviar mensaje de prueba\n' +
    '🆘 /help - Mostrar ayuda',
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/status/, (msg) => {
  const mqttStatus = mqttClient.connected ? '✅ CONECTADO' : '❌ DESCONECTADO';
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  bot.sendMessage(msg.chat.id,
    `*📊 ESTADO DEL BOT EA7*\n\n` +
    `🔌 *MQTT:* ${mqttStatus}\n` +
    `🌐 *Broker:* ${CONFIG.MQTT_HOST}:${CONFIG.MQTT_PORT}\n` +
    `🆔 *Nodo:* ${CONFIG.MESHTASTIC_NODE_ID}\n` +
    `⏱️ *Uptime:* ${hours}h ${minutes}m\n` +
    `👤 *Chat ID:* ${CONFIG.TELEGRAM_CHAT_ID}`,
=======
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
>>>>>>> 44dd3c0efcbf4e1af28da5490f48213faf5b8bb4
    { parse_mode: 'Markdown' }
  );
});

<<<<<<< HEAD
bot.onText(/\/test/, (msg) => {
  if (!mqttClient.connected) {
    bot.sendMessage(msg.chat.id, '❌ No conectado a MQTT');
    return;
  }
  
  const testMsg = {
    type: 'text',
    payload: { text: '✅ Prueba desde Bot EA7' },
    channel: 0,
    from: CONFIG.MESHTASTIC_NODE_ID,
    to: 0xFFFFFFFF
  };
  
  const topic = `msh/EA7/2/json/${CONFIG.MESHTASTIC_NODE_ID}/text`;
  mqttClient.publish(topic, JSON.stringify(testMsg));
  
  bot.sendMessage(msg.chat.id, '🧪 Mensaje de prueba enviado a Meshtastic');
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `*🆘 AYUDA - BOT EA7*\n\n` +
    `*Comandos:*\n` +
    `/start - Mensaje de bienvenida\n` +
    `/status - Estado actual\n` +
    `/test - Enviar prueba\n` +
    `/help - Esta ayuda\n\n` +
    `*Uso:*\n` +
    `Envía cualquier texto para transmitir a Meshtastic\n\n` +
    `*Configuración:*\n` +
    `Nodo: ${CONFIG.MESHTASTIC_NODE_ID}\n` +
    `Chat ID: ${CONFIG.TELEGRAM_CHAT_ID}`,
=======
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
>>>>>>> 44dd3c0efcbf4e1af28da5490f48213faf5b8bb4
    { parse_mode: 'Markdown' }
  );
});

<<<<<<< HEAD
// 6. HEALTH ENDPOINT PARA RENDER
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online',
    service: 'EA7 Meshtastic Bot',
    node: CONFIG.MESHTASTIC_NODE_ID,
    chat_id: CONFIG.TELEGRAM_CHAT_ID,
    mqtt: mqttClient.connected ? 'connected' : 'disconnected',
    uptime: process.uptime()
  }));
}).listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Health endpoint en puerto ${process.env.PORT || 3000}`);
  console.log(`🔗 URL: https://ea7-mesh-bot-1.onrender.com`);
});

console.log('✅ Bot completamente inicializado y listo!');
console.log('='.repeat(60));
=======
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
>>>>>>> 44dd3c0efcbf4e1af28da5490f48213faf5b8bb4

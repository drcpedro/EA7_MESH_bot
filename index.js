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
    { parse_mode: 'Markdown' }
  );
});

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
    { parse_mode: 'Markdown' }
  );
});

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

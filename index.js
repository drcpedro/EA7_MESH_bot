// ============================================
// EA7! MESHTASTIC-TELEGRAM BRIDGE
// Versión optimizada para Render
// ============================================

const TelegramBot = require('node-telegram-bot-api');
const mqtt = require('mqtt');
const express = require('express');

console.log('='.repeat(60));
console.log('🚀 INICIANDO EA7! MESHTASTIC-TELEGRAM BRIDGE');
console.log('='.repeat(60));

// ================= CONFIGURACIÓN =================
const CONFIG = {
  TELEGRAM: {
    TOKEN: process.env.TELEGRAM_TOKEN || process.env.TELETOKE,
    CHAT_ID: process.env.TELEGRAM_CHAT_ID
  },
  MQTT: {
    HOST: process.env.MQTT_HOST || 'mqtt.meshtastic.pt',
    PORT: parseInt(process.env.MQTT_PORT) || 8883,
    USERNAME: process.env.MQTT_USERNAME || 'EA7!',
    PASSWORD: process.env.MQTT_PASSWORD || 'PTEA7!',
    USE_TLS: process.env.MQTT_TLS !== 'false',
    TOPIC_PREFIX: process.env.MQTT_TOPIC_PREFIX || 'msh/EA7'
  },
  MESHTASTIC: {
    NODE_ID: process.env.MESHTASTIC_NODE_ID || '!EA8030URE'
  },
  APP: {
    PORT: process.env.PORT || 3000,
    URL: process.env.RENDER_URL || 'https://ea7-mesh-bot-1.onrender.com'
  }
};

// Validar configuración crítica
console.log('\n📋 CONFIGURACIÓN CARGADA:');
console.log('- Telegram Token:', CONFIG.TELEGRAM.TOKEN ? '✅ Presente' : '❌ FALTANTE');
console.log('- Telegram Chat ID:', CONFIG.TELEGRAM.CHAT_ID ? `✅ ${CONFIG.TELEGRAM.CHAT_ID}` : '❌ FALTANTE');
console.log('- MQTT Server:', `${CONFIG.MQTT.HOST}:${CONFIG.MQTT.PORT}`);
console.log('- MQTT User:', CONFIG.MQTT.USERNAME);
console.log('- Node ID:', CONFIG.MESHTASTIC.NODE_ID);
console.log('- TLS:', CONFIG.MQTT.USE_TLS ? '✅ Activado' : '❌ Desactivado');

if (!CONFIG.TELEGRAM.TOKEN || !CONFIG.TELEGRAM.CHAT_ID) {
  console.error('\n❌ ERROR: Faltan variables de entorno críticas!');
  console.error('   Asegúrate de tener TELEGRAM_TOKEN y TELEGRAM_CHAT_ID configurados en Render.');
  process.exit(1);
}

// ================= INICIAR TELEGRAM =================
console.log('\n🤖 INICIANDO BOT DE TELEGRAM...');
let bot;
try {
  bot = new TelegramBot(CONFIG.TELEGRAM.TOKEN, {
    polling: {
      interval: 300,
      autoStart: true,
      params: { timeout: 10 }
    }
  });
  console.log('✅ Bot de Telegram inicializado');
} catch (error) {
  console.error('❌ Error iniciando bot Telegram:', error.message);
  process.exit(1);
}

// ================= CONEXIÓN MQTT =================
console.log('\n📡 CONECTANDO A MQTT...');
let mqttClient = null;

function connectToMQTT() {
  const mqttOptions = {
    clientId: `ea7-bridge-${Date.now()}`,
    username: CONFIG.MQTT.USERNAME,
    password: CONFIG.MQTT.PASSWORD,
    rejectUnauthorized: false,
    connectTimeout: 10000,
    keepalive: 60,
    reconnectPeriod: 5000
  };

  const protocol = CONFIG.MQTT.USE_TLS ? 'mqtts' : 'mqtt';
  const mqttUrl = `${protocol}://${CONFIG.MQTT.HOST}:${CONFIG.MQTT.PORT}`;
  
  console.log(`🔌 Conectando a: ${mqttUrl}`);
  
  mqttClient = mqtt.connect(mqttUrl, mqttOptions);

  mqttClient.on('connect', () => {
    console.log('✅ CONEXIÓN MQTT ESTABLECIDA!');
    
    // Suscribirse a topics
    const topics = [
      `${CONFIG.MQTT.TOPIC_PREFIX}/2/json/#`,
      `${CONFIG.MQTT.TOPIC_PREFIX}/2/text/#`,
      `${CONFIG.MQTT.TOPIC_PREFIX}/2/stat/#`
    ];
    
    topics.forEach(topic => {
      mqttClient.subscribe(topic, { qos: 0 }, (err) => {
        if (!err) {
          console.log(`📡 Suscrito a: ${topic}`);
        }
      });
    });
    
    // Notificar a Telegram
    bot.sendMessage(CONFIG.TELEGRAM.CHAT_ID,
      '🤖 *Bot Meshtastic EA7! ACTIVO*\n\n' +
      '✅ *Conectado al broker MQTT*\n' +
      '📡 *Listo para recibir/enviar mensajes*\n\n' +
      '📊 /status - Ver estado de conexión\n' +
      '🆘 /help - Mostrar ayuda',
      { parse_mode: 'Markdown' }
    );
  });

  mqttClient.on('message', (topic, message) => {
    const msgStr = message.toString();
    
    // Log simple
    if (msgStr.length > 0) {
      console.log(`📨 [${topic}] ${msgStr.substring(0, 100)}...`);
    }
    
    try {
      const data = JSON.parse(msgStr);
      handleMQTTMessage(data);
    } catch (e) {
      // Si no es JSON, puede ser texto plano
      if (msgStr.trim().length > 0 && topic.includes('/text/')) {
        forwardToTelegram(`📡 ${msgStr.trim()}`);
      }
    }
  });

  mqttClient.on('error', (err) => {
    console.error('❌ Error MQTT:', err.message);
  });

  mqttClient.on('close', () => {
    console.log('🔌 Conexión MQTT cerrada');
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 Reconectando a MQTT...');
  });
}

// ================= MANEJAR MENSAJES MQTT =================
function handleMQTTMessage(data) {
  if (data.type === 'text' && data.payload?.text) {
    const from = data.from || 'Desconocido';
    const text = data.payload.text;
    
    console.log(`💬 ${from}: ${text}`);
    forwardToTelegram(`📡 *${from}*:\n${text}`);
  }
}

// ================= FUNCIONES AUXILIARES =================
function forwardToTelegram(message, markdown = true) {
  try {
    const options = markdown ? { parse_mode: 'Markdown' } : {};
    bot.sendMessage(CONFIG.TELEGRAM.CHAT_ID, message, options);
  } catch (error) {
    console.error('Error enviando a Telegram:', error.message);
  }
}

function sendToMeshtastic(text, sender = 'Telegram') {
  if (!mqttClient || !mqttClient.connected) {
    console.error('❌ No se puede enviar: MQTT desconectado');
    return false;
  }
  
  try {
    const message = {
      type: 'text',
      payload: {
        text: text,
        wantAck: false,
        wantResponse: false
      },
      channel: 0,
      from: CONFIG.MESHTASTIC.NODE_ID,
      to: 0xFFFFFFFF
    };
    
    const topic = `${CONFIG.MQTT.TOPIC_PREFIX}/2/json/${CONFIG.MESHTASTIC.NODE_ID}/text`;
    mqttClient.publish(topic, JSON.stringify(message));
    
    console.log(`📤 [${sender}] → Meshtastic: ${text}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando a Meshtastic:', error);
    return false;
  }
}

// ================= COMANDOS TELEGRAM =================
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '🤖 *Bot Meshtastic EA7!*\n\n' +
    'Envía cualquier mensaje para transmitirlo a la red Meshtastic.\n' +
    'Los mensajes de Meshtastic aparecerán aquí automáticamente.\n\n' +
    '📊 /status - Estado de conexión\n' +
    '🔧 /test - Enviar mensaje de prueba\n' +
    '🆘 /help - Ayuda y comandos',
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/status/, (msg) => {
  const mqttStatus = mqttClient?.connected ? '✅ CONECTADO' : '❌ DESCONECTADO';
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  bot.sendMessage(msg.chat.id,
    `*📊 ESTADO DEL PUENTE EA7!*\n\n` +
    `🔌 *MQTT:* ${mqttStatus}\n` +
    `🌐 *Broker:* ${CONFIG.MQTT.HOST}:${CONFIG.MQTT.PORT}\n` +
    `🔐 *Usuario:* ${CONFIG.MQTT.USERNAME}\n` +
    `🆔 *Nodo:* ${CONFIG.MESHTASTIC.NODE_ID}\n` +
    `⏱️ *Uptime:* ${hours}h ${minutes}m\n` +
    `🔧 *TLS:* ${CONFIG.MQTT.USE_TLS ? 'Activado' : 'Desactivado'}`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/test/, (msg) => {
  const success = sendToMeshtastic('✅ Prueba desde Telegram Bot', 'Telegram');
  if (success) {
    bot.sendMessage(msg.chat.id, '🧪 Mensaje de prueba enviado a Meshtastic');
  } else {
    bot.sendMessage(msg.chat.id, '❌ Error enviando prueba. Verifica conexión MQTT.');
  }
});

bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `*🆘 COMANDOS DISPONIBLES*\n\n` +
    `📡 Envía cualquier texto para transmitir a Meshtastic\n\n` +
    `*Comandos:*\n` +
    `/start - Mensaje de bienvenida\n` +
    `/status - Estado de conexión\n` +
    `/test - Enviar mensaje de prueba\n` +
    `/help - Esta ayuda\n\n` +
    `*Configuración actual:*\n` +
    `Nodo: ${CONFIG.MESHTASTIC.NODE_ID}\n` +
    `Broker: ${CONFIG.MQTT.HOST}:${CONFIG.MQTT.PORT}\n` +
    `Usuario: ${CONFIG.MQTT.USERNAME}`,
    { parse_mode: 'Markdown' }
  );
});

// Mensajes normales de Telegram → Meshtastic
bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  
  const success = sendToMeshtastic(msg.text, msg.from?.first_name || 'Telegram');
  if (success) {
    bot.sendMessage(msg.chat.id, '✅ Mensaje enviado a red Meshtastic');
  } else {
    bot.sendMessage(msg.chat.id, '❌ Error enviando mensaje. Verifica conexión MQTT.');
  }
});

// ================= SERVIDOR WEB =================
const app = express();

app.get('/', (req, res) => {
  res.json({
    service: 'EA7! Meshtastic-Telegram Bridge',
    version: '1.0.0',
    status: 'operational',
    connections: {
      mqtt: mqttClient?.connected ? 'connected' : 'disconnected',
      telegram: 'active'
    },
    config: {
      node: CONFIG.MESHTASTIC.NODE_ID,
      broker: `${CONFIG.MQTT.HOST}:${CONFIG.MQTT.PORT}`,
      telegram_chat: CONFIG.TELEGRAM.CHAT_ID ? 'configured' : 'missing'
    },
    endpoints: {
      health: '/health',
      status: '/status'
    },
    uptime: process.uptime()
  });
});

app.get('/health', (req, res) => {
  const isHealthy = mqttClient?.connected && bot;
  res.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    mqtt: mqttClient?.connected ? 'connected' : 'disconnected',
    telegram: bot ? 'active' : 'inactive',
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  res.json({
    mqtt_connected: mqttClient?.connected || false,
    uptime: process.uptime(),
    node_id: CONFIG.MESHTASTIC.NODE_ID
  });
});

// Iniciar servidor
app.listen(CONFIG.APP.PORT, () => {
  console.log(`🌐 Servidor web en puerto ${CONFIG.APP.PORT}`);
  console.log(`🔗 URL: ${CONFIG.APP.URL}`);
  
  // Iniciar conexión MQTT después de que el servidor esté listo
  setTimeout(() => {
    connectToMQTT();
  }, 1000);
});

// ================= MANEJO DE ERRORES =================
process.on('uncaughtException', (error) => {
  console.error('⚠️ Excepción no capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Promesa rechazada no manejada:', reason);
});

console.log('\n✅ INICIALIZACIÓN COMPLETADA');
console.log('='.repeat(60));

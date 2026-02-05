const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const mqtt = require('mqtt');
const app = express();

// ================== CONFIGURACIÓN ==================
const TELEGRAM_TOKEN = '8482781617:AAFrS2W5SpHM-Ksx1N8oVrVHE0mbMhL3as8';
const TELEGRAM_GROUP_ID = -4726053664;
const TELEGRAM_ADMIN_ID = 602599168;

const MQTT_CONFIG = {
  broker: 'mqtt://145.239.69.53:1883',
  username: 'EA7!',
  password: 'PTEA7!',
  topics: [
    'msh/EA7/json',   // JSON format
    'msh/2/json',     // JSON format (default)
    'msh/EA7/#',      // All binary topics
    'msh/2/#'         // All binary topics (default)
  ],
  clientId: 'ea7_universal_' + Math.random().toString(16).slice(2)
};

// ================== INICIALIZACIÓN ==================
console.log('🤖 BOT UNIVERSAL (JSON + Binario)');
console.log('📡 Suscribiendo a todos los formatos...');

const bot = new TelegramBot(TELEGRAM_TOKEN, { 
  polling: false
});

let mqttClient = null;

app.use(express.json());

// ================== CONEXIÓN MQTT ==================
function connectToMQTT() {
  console.log('🔌 Conectando a MQTT...');
  
  const options = {
    clientId: MQTT_CONFIG.clientId,
    username: MQTT_CONFIG.username,
    password: MQTT_CONFIG.password,
    clean: true,
    connectTimeout: 10000
  };

  mqttClient = mqtt.connect(MQTT_CONFIG.broker, options);

  mqttClient.on('connect', () => {
    console.log('✅ Conectado a MQTT');
    
    // Suscribirse a todos los topics
    MQTT_CONFIG.topics.forEach(topic => {
      mqttClient.subscribe(topic, (err) => {
        if (!err) {
          console.log('📡 Suscrito a:', topic);
        }
      });
    });
    
    // Mensaje de prueba
    const testMsg = JSON.stringify({
      type: 'txt',
      text: '🤖 Bot universal conectado',
      fromName: 'EA7_Bot_Universal',
      timestamp: Date.now()
    });
    
    mqttClient.publish('msh/EA7/json', testMsg);
    console.log('📤 Mensaje de prueba enviado');
  });

  mqttClient.on('message', (topic, message) => {
    console.log(`\n📨 Mensaje recibido [${topic}]`);
    
    // INTENTAR como JSON primero
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'txt' && data.text) {
        console.log('✅ Formato JSON detectado');
        console.log(`👤 ${data.fromName}: ${data.text}`);
        
        // Enviar a Telegram
        const telegramMsg = `📡 *MENSAJE MESH (JSON)*\n\n` +
                          `👤 ${data.fromName || 'Anónimo'}\n` +
                          `💬 ${data.text}\n` +
                          `🕒 ${new Date().toLocaleTimeString()}`;
        
        bot.sendMessage(TELEGRAM_GROUP_ID, telegramMsg, { parse_mode: 'Markdown' })
          .then(() => console.log('✅ Enviado a Telegram'))
          .catch(err => console.log('⚠️  Telegram:', err.message));
          
        return; // Salir si fue JSON exitoso
      }
    } catch (error) {
      // No es JSON, es binario
      console.log('🔢 Formato binario/protobuf detectado');
      
      // Mostrar información básica del mensaje binario
      const buffer = message;
      console.log(`📊 Tamaño: ${buffer.length} bytes`);
      console.log(`📡 Topic: ${topic}`);
      
      // Extraer información básica del topic
      const topicParts = topic.split('/');
      if (topicParts.length >= 5) {
        const fromNode = topicParts[1]; // EA7 o 2
        const toNode = topicParts[3];   // LongFast, MediumFast, etc
        const messageId = topicParts[4]; // !e71e06bd
        
        console.log(`📟 From: ${fromNode}`);
        console.log(`📟 To: ${toNode}`);
        console.log(`🆔 Message ID: ${messageId}`);
        
        // Intentar extraer texto si es posible (simplificado)
        try {
          const text = extractTextFromBinary(buffer);
          if (text) {
            console.log(`💬 Texto extraído: ${text}`);
            
            const telegramMsg = `📡 *MENSAJE MESH (Binario)*\n\n` +
                              `📟 De nodo: ${fromNode}\n` +
                              `📟 Para: ${toNode}\n` +
                              `💬 ${text}\n` +
                              `🔢 Formato: Protobuf\n` +
                              `🕒 ${new Date().toLocaleTimeString()}`;
            
            bot.sendMessage(TELEGRAM_GROUP_ID, telegramMsg, { parse_mode: 'Markdown' })
              .then(() => console.log('✅ Binario enviado a Telegram'))
              .catch(err => console.log('⚠️  Telegram:', err.message));
          }
        } catch (e) {
          console.log('⚠️  No se pudo extraer texto del binario');
        }
      }
    }
  });
}

// Función simple para extraer texto de binario Meshtastic
function extractTextFromBinary(buffer) {
  try {
    // Buscar texto en el buffer (simplificado)
    const bufferStr = buffer.toString('latin1');
    
    // Buscar patrones comunes
    const textMatch = bufferStr.match(/[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,!?¡¿]{3,}/);
    if (textMatch) {
      return textMatch[0].substring(0, 100); // Limitar a 100 caracteres
    }
    
    // Intentar como UTF-8
    const utf8Str = buffer.toString('utf8', 0, Math.min(buffer.length, 200));
    const cleanStr = utf8Str.replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑ]/g, ' ').trim();
    if (cleanStr.length > 3) {
      return cleanStr.substring(0, 100);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// ================== TELEGRAM ==================
bot.onText(/\/status/, (msg) => {
  const status = `🤖 *BOT UNIVERSAL EA7*\n\n` +
                `📡 Conectado a MQTT\n` +
                `🔗 Broker: 145.239.69.53:1883\n` +
                `👤 Usuario: EA7!\n` +
                `🔄 Soporta: JSON + Binario\n\n` +
                `⚠️ *IMPORTANTE:* Tu nodo está enviando en formato binario.\n` +
                `Para mejor compatibilidad, configura tu nodo:\n` +
                `\`meshtastic --set mqtt.json_enabled true\``;
  
  bot.sendMessage(msg.chat.id, status, { parse_mode: 'Markdown' });
});

// Enviar mensajes a MQTT (siempre en JSON)
bot.on('message', (msg) => {
  if (msg.chat.id !== TELEGRAM_GROUP_ID || !msg.text || msg.text.startsWith('/')) return;
  
  if (mqttClient && mqttClient.connected) {
    const meshMessage = JSON.stringify({
      type: 'txt',
      text: msg.text,
      from: msg.from.id,
      fromName: msg.from.first_name || 'Telegram',
      timestamp: Date.now()
    });
    
    mqttClient.publish('msh/EA7/json', meshMessage);
    console.log(`📤 Telegram → MQTT (JSON): ${msg.text.substring(0, 50)}...`);
  }
});

// ================== SERVICIO WEB ==================
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>EA7 Bot Universal</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .warning { color: #d35400; background: #fef5e7; padding: 10px; border-radius: 5px; }
        .info { color: #2980b9; background: #ebf5fb; padding: 10px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>🤖 EA7 Bot Universal</h1>
      <div class="info">
        <strong>✅ CONECTADO</strong><br>
        Broker: 145.239.69.53:1883<br>
        Usuario: EA7!<br>
        Estado: Recibiendo mensajes
      </div>
      <div class="warning">
        <strong>⚠️ AVISO IMPORTANTE</strong><br>
        Tu nodo está enviando mensajes en formato <strong>BINARIO/PROTOBUF</strong>.<br>
        Para mejor compatibilidad, configura tu nodo:<br>
        <code>meshtastic --set mqtt.json_enabled true</code>
      </div>
      <p><a href="/health">Health Check</a></p>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mqtt: mqttClient ? mqttClient.connected : false,
    format: 'universal (json + binary)',
    timestamp: new Date().toISOString()
  });
});

// ================== INICIAR ==================
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Bot Universal en puerto ${PORT}`);
  console.log(`🌐 Web: http://localhost:${PORT}`);
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  IMPORTANTE: Tu nodo envía mensajes en BINARIO');
  console.log('   Ejecuta: meshtastic --set mqtt.json_enabled true');
  console.log('='.repeat(60) + '\n');
  
  connectToMQTT();
});

process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo bot...');
  if (mqttClient) {
    mqttClient.end();
  }
  process.exit(0);
});

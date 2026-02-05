const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const mqtt = require('mqtt');
const app = express();

// ================== CONFIGURACIÓN ==================
const TELEGRAM_TOKEN = '8482781617:AAFrS2W5SpHM-Ksx1N8oVrVHE0mbMhL3as8';
const TELEGRAM_GROUP_ID = -4726053664;
const TELEGRAM_ADMIN_ID = 602599168;

// CONFIGURACIÓN MQTT
const MQTT_CONFIG = {
  broker: 'mqtt://145.239.69.53:1883',
  username: 'EA7!',
  password: 'PTEA7!',
  topic: 'msh/EA7/json',
  clientId: 'ea7_debug_' + Math.random().toString(16).slice(2)
};

// ================== INICIALIZACIÓN ==================
console.log('🤖 INICIANDO BOT EN MODO DEBUG');
console.log('📊 Configuración MQTT:');
console.log('  Broker:', MQTT_CONFIG.broker);
console.log('  Topic:', MQTT_CONFIG.topic);
console.log('  Usuario:', MQTT_CONFIG.username);

const bot = new TelegramBot(TELEGRAM_TOKEN, { 
  polling: false
});

let mqttClient = null;
let messageCount = 0;

app.use(express.json());

// ================== CONEXIÓN MQTT CON DEBUG ==================
function connectToMQTT() {
  console.log('\n🔌 CONECTANDO A MQTT...');
  
  const options = {
    clientId: MQTT_CONFIG.clientId,
    username: MQTT_CONFIG.username,
    password: MQTT_CONFIG.password,
    clean: true,
    connectTimeout: 10000,
    reconnectPeriod: 3000
  };

  mqttClient = mqtt.connect(MQTT_CONFIG.broker, options);

  mqttClient.on('connect', () => {
    console.log('✅ EVENTO: MQTT CONNECT');
    console.log('✅ Conectado al broker');
    
    // Suscribirse a VARIOS topics para debug
    const topics = [
      'msh/EA7/json',
      'msh/2/json',
      'msh/+/json',
      'msh/#'
    ];
    
    topics.forEach(topic => {
      mqttClient.subscribe(topic, (err) => {
        if (err) {
          console.log('❌ Error suscribiendo a', topic, ':', err.message);
        } else {
          console.log('✅ Suscrito a:', topic);
        }
      });
    });
    
    // Enviar mensaje de prueba
    const testMsg = JSON.stringify({
      type: 'txt',
      text: '🔧 Mensaje de prueba desde bot DEBUG',
      fromName: 'EA7_Bot_Debug',
      timestamp: Date.now()
    });
    
    console.log('📤 Enviando mensaje de prueba a', MQTT_CONFIG.topic);
    mqttClient.publish(MQTT_CONFIG.topic, testMsg, (err) => {
      if (err) {
        console.log('❌ Error publicando:', err.message);
      } else {
        console.log('✅ Mensaje de prueba publicado');
      }
    });
  });

  mqttClient.on('message', (topic, message) => {
    messageCount++;
    console.log('\n' + '='.repeat(50));
    console.log('📨 EVENTO: MQTT MESSAGE #' + messageCount);
    console.log('📡 Topic:', topic);
    console.log('📄 Mensaje RAW:', message.toString().substring(0, 200));
    
    try {
      const data = JSON.parse(message.toString());
      console.log('📊 JSON parseado:');
      console.log('  Tipo:', data.type);
      console.log('  Texto:', data.text);
      console.log('  From:', data.from);
      console.log('  FromName:', data.fromName);
      console.log('  Timestamp:', data.timestamp);
      
      if (data.type === 'txt' && data.text) {
        console.log('💬 Mensaje de texto detectado!');
        
        // Intentar enviar a Telegram
        const telegramMsg = `📡 *DEBUG - Mensaje MESH*\n\n` +
                          `📡 Topic: ${topic}\n` +
                          `👤 ${data.fromName || 'Anónimo'}\n` +
                          `💬 ${data.text}\n` +
                          `🆔 ${data.from || 'N/A'}\n` +
                          `🕒 ${new Date().toLocaleTimeString()}`;
        
        bot.sendMessage(TELEGRAM_GROUP_ID, telegramMsg, { parse_mode: 'Markdown' })
          .then(() => console.log('✅ Telegram: Mensaje enviado'))
          .catch(err => console.log('❌ Telegram error:', err.message));
      } else {
        console.log('ℹ️  No es mensaje de texto o no tiene texto');
      }
    } catch (error) {
      console.log('❌ Error parseando JSON:', error.message);
    }
    console.log('='.repeat(50));
  });

  mqttClient.on('error', (error) => {
    console.log('❌ EVENTO: MQTT ERROR');
    console.log('Error:', error.message);
  });

  mqttClient.on('close', () => {
    console.log('⚠️  EVENTO: MQTT CLOSE');
  });
}

// ================== TELEGRAM DEBUG ==================
bot.on('polling_error', (error) => {
  console.log('❌ TELEGRAM POLLING ERROR:', error.message);
});

bot.onText(/\/debug/, (msg) => {
  console.log('\n🔧 COMANDO DEBUG RECIBIDO');
  console.log('De:', msg.from.first_name, '(ID:', msg.from.id, ')');
  console.log('Chat ID:', msg.chat.id);
  console.log('Es grupo objetivo?', msg.chat.id == TELEGRAM_GROUP_ID);
  
  const status = `🔧 *DEBUG INFO*\n\n` +
                `🤖 Bot: EA7 Debug\n` +
                `📡 MQTT: ${mqttClient ? (mqttClient.connected ? '✅ Conectado' : '❌ Desconectado') : '❌ No inicializado'}\n` +
                `📨 Mensajes recibidos: ${messageCount}\n` +
                `🕒 Hora: ${new Date().toLocaleTimeString()}\n\n` +
                `💬 Escribe un mensaje normal para probar envío a MQTT`;
  
  bot.sendMessage(msg.chat.id, status, { parse_mode: 'Markdown' })
    .then(() => console.log('✅ Respuesta debug enviada'))
    .catch(err => console.log('❌ Error enviando debug:', err.message));
});

// Escuchar TODOS los mensajes de Telegram
bot.on('message', (msg) => {
  console.log('\n📱 TELEGRAM MESSAGE RECEIVED');
  console.log('Chat ID:', msg.chat.id);
  console.log('Group ID objetivo:', TELEGRAM_GROUP_ID);
  console.log('Coinciden?', msg.chat.id == TELEGRAM_GROUP_ID);
  console.log('De:', msg.from?.first_name, '(ID:', msg.from?.id, ')');
  console.log('Texto:', msg.text);
  console.log('Es comando?:', msg.text?.startsWith('/'));
  
  // Solo procesar mensajes del grupo y que no sean comandos
  if (msg.chat.id == TELEGRAM_GROUP_ID && msg.text && !msg.text.startsWith('/')) {
    console.log('✅ Mensaje válido para procesar');
    
    if (mqttClient && mqttClient.connected) {
      const meshMessage = JSON.stringify({
        type: 'txt',
        text: msg.text,
        from: msg.from?.id || 0,
        fromName: msg.from?.first_name || 'Telegram User',
        timestamp: Date.now()
      });
      
      console.log('📤 Publicando a MQTT:', MQTT_CONFIG.topic);
      console.log('📄 Contenido:', meshMessage);
      
      mqttClient.publish(MQTT_CONFIG.topic, meshMessage, (err) => {
        if (err) {
          console.log('❌ Error publicando:', err.message);
        } else {
          console.log('✅ Publicado exitosamente a MQTT');
        }
      });
    } else {
      console.log('❌ MQTT no está conectado');
    }
  } else {
    console.log('⏭️  Mensaje ignorado');
  }
});

// ================== SERVICIO WEB ==================
app.get('/', (req, res) => {
  res.json({
    service: 'EA7 Debug Bot',
    status: 'running',
    mqtt_connected: mqttClient ? mqttClient.connected : false,
    messages_received: messageCount,
    config: {
      broker: MQTT_CONFIG.broker,
      topic: MQTT_CONFIG.topic,
      telegram_group: TELEGRAM_GROUP_ID
    },
    timestamp: new Date().toISOString()
  });
});

// ================== INICIAR ==================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Debug Bot en puerto ${PORT}`);
  console.log(`🌐 Web: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/`);
  console.log('\n' + '='.repeat(50));
  console.log('🟢 BOT EN MODO DEBUG ACTIVADO');
  console.log('='.repeat(50) + '\n');
  
  connectToMQTT();
});

// Manejar cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo debug bot...');
  if (mqttClient) {
    mqttClient.end();
  }
  process.exit(0);
});

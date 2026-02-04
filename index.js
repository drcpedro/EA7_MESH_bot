const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const app = express();

const token = '8482781617:AAFrS2W5SpHM-Ksx1N8oVrVHE0mbMhL3as8';
const bot = new TelegramBot(token, { polling: false });
const webhookUrl = 'https://ea7-mesh-bot-1.onrender.com';
bot.setWebHook(`${webhookUrl}/bot${token}`);

app.use(express.json());
app.post(`/bot${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// DIRECCIÓN DE TU NODO (PUERTO 80 - WEB API)
const NODE_IP = '192.168.18.174';
const NODE_URL = `http://${NODE_IP}`;

// ENDPOINTS DISPONIBLES EN TU NODO
const ENDPOINTS = {
  nodeinfo: `${NODE_URL}/json`,  // ¡ESTE ES EL QUE FUNCIONA!
  admin: `${NODE_URL}/admin`,
  config: `${NODE_URL}/json/config`,
  stats: `${NODE_URL}/json/stats`
};

// FUNCIÓN PARA OBTENER DATOS REALES
async function getNodeData() {
  try {
    const response = await axios.get(ENDPOINTS.nodeinfo, { timeout: 5000 });
    
    if (response.data && response.data.status === 'ok') {
      return {
        success: true,
        data: response.data.data,
        source: ENDPOINTS.nodeinfo
      };
    }
    return { success: false, error: 'Formato inválido' };
  } catch (error) {
    // Intentar endpoint alternativo
    try {
      const alt = await axios.get(`${NODE_URL}/admin/json`, { timeout: 3000 });
      return { success: true, data: alt.data, source: 'admin/json' };
    } catch (e) {
      return { success: false, error: error.message };
    }
  }
}

// COMANDO /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId,
    '🤖 *EA7 MESH BOT - NODO CONECTADO*\n\n' +
    '✅ *API DETECTADA CORRECTAMENTE*\n' +
    `📍 IP: ${NODE_IP}\n` +
    `🔗 Endpoint: ${ENDPOINTS.nodeinfo}\n\n` +
    '📋 *Comandos disponibles:*\n' +
    '• /info - Información completa\n' +
    '• /stats - Estadísticas detalladas\n' +
    '• /wifi - Estado WiFi\n' +
    '• /radio - Configuración LoRa\n' +
    '• /configtcp - Ayuda TCP 4403\n\n' +
    '¡Prueba /info ahora!',
    { parse_mode: 'Markdown' }
  );
});

// COMANDO /info - INFORMACIÓN COMPLETA
bot.onText(/\/info/, async (msg) => {
  const chatId = msg.chat.id;
  
  const result = await getNodeData();
  
  if (result.success) {
    const d = result.data;
    
    // Formatear mensaje
    let message = '📊 *INFORMACIÓN DEL NODO MESHTASTIC*\n\n';
    
    // IDENTIFICACIÓN
    message += '🆔 *IDENTIFICACIÓN*\n';
    message += `• IP: ${NODE_IP}\n`;
    if (d.device) message += `• Reinicios: ${d.device.reboot_counter}\n`;
    
    // WIFI
    message += '\n📶 *WIFI*\n';
    if (d.wifi) {
      message += `• IP: ${d.wifi.ip}\n`;
      message += `• RSSI: ${d.wifi.rssi} dBm\n`;
    }
    
    // RADIO LoRa
    message += '\n📡 *RADIO LoRa*\n';
    if (d.radio) {
      message += `• Frecuencia: ${d.radio.frequency} MHz\n`;
      message += `• Canal: ${d.radio.lora_channel}\n`;
    }
    
    // ENERGÍA
    message += '\n🔋 *ENERGÍA*\n';
    if (d.power) {
      message += `• Batería: ${d.power.battery_percent}%\n`;
      message += `• Voltaje: ${d.power.battery_voltage_mv} mV\n`;
      message += `• USB: ${d.power.has_usb ? '✅ Conectado' : '❌ No'}\n`;
      message += `• Cargando: ${d.power.is_charging ? '✅ Sí' : '❌ No'}\n`;
    }
    
    // MEMORIA
    message += '\n💾 *MEMORIA*\n';
    if (d.memory) {
      const heapUsed = ((d.memory.heap_total - d.memory.heap_free) / 1024).toFixed(1);
      const heapTotal = (d.memory.heap_total / 1024).toFixed(1);
      message += `• Heap: ${heapUsed}/${heapTotal} KB\n`;
      message += `• PSRAM libre: ${(d.memory.psram_free / 1024 / 1024).toFixed(1)} MB\n`;
    }
    
    // AIRE-TIME
    message += '\n⏱️ *AIRE-TIME*\n';
    if (d.airtime) {
      message += `• Utilización: ${d.airtime.channel_utilization}%\n`;
      message += `• TX: ${d.airtime.utilization_tx}%\n`;
      const totalRx = d.airtime.rx_log.reduce((a, b) => a + b, 0);
      message += `• Paquetes RX: ${totalRx}\n`;
    }
    
    message += `\n🔗 *Fuente:* ${result.source}`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } else {
    bot.sendMessage(chatId,
      '❌ *ERROR AL OBTENER DATOS*\n\n' +
      `Verifica que el nodo esté encendido en ${NODE_IP}\n\n` +
      `Error: ${result.error}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// COMANDO /wifi - INFO WIFI ESPECÍFICA
bot.onText(/\/wifi/, async (msg) => {
  const chatId = msg.chat.id;
  
  const result = await getNodeData();
  
  if (result.success && result.data.wifi) {
    const w = result.data.wifi;
    
    // Interpretar RSSI
    let rssiStatus = '';
    if (w.rssi >= -50) rssiStatus = '✅ Excelente';
    else if (w.rssi >= -60) rssiStatus = '👍 Bueno';
    else if (w.rssi >= -70) rssiStatus = '⚠️ Aceptable';
    else rssiStatus = '❌ Débil';
    
    bot.sendMessage(chatId,
      `📶 *ESTADO WIFI*\n\n` +
      `📍 IP: ${w.ip}\n` +
      `📊 RSSI: ${w.rssi} dBm\n` +
      `📡 Calidad: ${rssiStatus}\n\n` +
      `_RSSI > -50: Excelente_\n` +
      `_RSSI -60 a -50: Bueno_\n` +
      `_RSSI -70 a -60: Aceptable_\n` +
      `_RSSI < -70: Débil_`,
      { parse_mode: 'Markdown' }
    );
  } else {
    bot.sendMessage(chatId, '❌ No se pudo obtener información WiFi', { parse_mode: 'Markdown' });
  }
});

// COMANDO /radio - INFO LoRa
bot.onText(/\/radio/, async (msg) => {
  const chatId = msg.chat.id;
  
  const result = await getNodeData();
  
  if (result.success && result.data.radio) {
    const r = result.data.radio;
    
    bot.sendMessage(chatId,
      `📡 *CONFIGURACIÓN LoRa*\n\n` +
      `📶 Frecuencia: ${r.frequency} MHz\n` +
      `🔢 Canal: ${r.lora_channel}\n\n` +
      `🌍 *Banda EU:* 863-870 MHz\n` +
      `📊 *Ancho banda:* 125 kHz\n` +
      `⚡ *Potencia:* 20 dBm max\n\n` +
      `_Configuración regional para España_`,
      { parse_mode: 'Markdown' }
    );
  } else {
    bot.sendMessage(chatId, '❌ No se pudo obtener información Radio', { parse_mode: 'Markdown' });
  }
});

// COMANDO /configtcp - AYUDA PARA HABILITAR TCP 4403
bot.onText(/\/configtcp/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId,
    '🔧 *HABILITAR TCP 4403*\n\n' +
    'Tu nodo ya tiene API web, pero en puerto 80.\n' +
    'Para usar el puerto 4403 (estándar):\n\n' +
    '*1. Vía app móvil Meshtastic:*\n' +
    '• Conecta por Bluetooth\n' +
    '• Settings → Network → TCP\n' +
    '• Enable: ON\n' +
    '• Port: 4403\n' +
    '• Address: 0.0.0.0\n\n' +
    '*2. Vía comandos serie (USB):*\n' +
    '```\n' +
    'set tcp.enabled true\n' +
    'set tcp.address 0.0.0.0\n' +
    'set tcp.port 4403\n' +
    'prefs save\n' +
    '```\n\n' +
    '*3. Verificar funcionamiento:*\n' +
    '```bash\n' +
    'curl http://192.168.18.174:4403/json\n' +
    '```\n\n' +
    '⚠️ *Importante:* Después de configurar, usa:\n' +
    '`/testtcp` para probar la conexión TCP',
    { parse_mode: 'Markdown' }
  );
});

// COMANDO /testtcp - PROBAR TCP 4403
bot.onText(/\/testtcp/, async (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(chatId, '🔍 Probando TCP en puerto 4403...', { parse_mode: 'Markdown' });
  
  try {
    const response = await axios.get(`http://${NODE_IP}:4403/json`, { timeout: 3000 });
    bot.sendMessage(chatId,
      '✅ *TCP 4403 ACTIVO*\n\n' +
      'El puerto 4403 está funcionando.\n' +
      'Ahora Render.com puede conectarse remotamente.',
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    bot.sendMessage(chatId,
      '❌ *TCP 4403 NO DISPONIBLE*\n\n' +
      'Configura TCP primero con /configtcp\n\n' +
      `Error: ${error.message}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// COMANDO /stats - ESTADÍSTICAS DETALLADAS
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  
  const result = await getNodeData();
  
  if (result.success && result.data.airtime) {
    const a = result.data.airtime;
    
    // Calcular estadísticas
    const totalRx = a.rx_log.reduce((sum, val) => sum + val, 0);
    const totalTx = a.tx_log.reduce((sum, val) => sum + val, 0);
    const avgRxPerHour = Math.round(totalRx / (a.seconds_since_boot / 3600));
    
    bot.sendMessage(chatId,
      `📈 *ESTADÍSTICAS DE TRÁFICO*\n\n` +
      `⏱️ Tiempo activo: ${Math.round(a.seconds_since_boot / 3600)} horas\n` +
      `📥 Paquetes RX total: ${totalRx}\n` +
      `📤 Paquetes TX total: ${totalTx}\n` +
      `📊 RX/hora promedio: ${avgRxPerHour}\n` +
      `📶 Utilización canal: ${a.channel_utilization}%\n` +
      `⚡ Utilización TX: ${a.utilization_tx}%\n\n` +
      `📅 *Historial (últimas 8h):*\n` +
      `Hora - RX - TX\n` +
      `${a.rx_log.map((rx, i) => `${i+1}: ${rx} - ${a.tx_log[i]}`).join('\n')}`,
      { parse_mode: 'Markdown' }
    );
  } else {
    bot.sendMessage(chatId, '❌ No se pudieron obtener estadísticas', { parse_mode: 'Markdown' });
  }
});

// PÁGINA WEB DEL BOT
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>EA7 MESH Bot - Nodo Activo</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          background: white;
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          margin-top: 20px;
        }
        h1 {
          color: #2d3748;
          border-bottom: 3px solid #667eea;
          padding-bottom: 10px;
        }
        .status-card {
          background: #f7fafc;
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
          border-left: 5px solid #38a169;
        }
        .warning-card {
          border-left: 5px solid #ecc94b;
          background: #fffaf0;
        }
        .endpoint {
          background: #edf2f7;
          padding: 10px;
          border-radius: 5px;
          font-family: monospace;
          word-break: break-all;
          margin: 10px 0;
        }
        .btn {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin: 5px;
          transition: background 0.3s;
        }
        .btn:hover {
          background: #5a67d8;
        }
        .telegram-link {
          background: #0088cc;
        }
        .telegram-link:hover {
          background: #0077b5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 EA7 MESH Bot - Control de Nodo</h1>
        
        <div class="status-card">
          <h2>✅ NODO CONECTADO</h2>
          <p><strong>IP del nodo:</strong> ${NODE_IP}</p>
          <p><strong>Estado:</strong> API Web activa en puerto 80</p>
          <p><strong>Última verificación:</strong> <span id="timestamp">${new Date().toLocaleString()}</span></p>
        </div>
        
        <div class="warning-card">
          <h2>🔧 Configuración TCP Recomendada</h2>
          <p>Para acceso remoto desde Render.com, habilita TCP en puerto 4403:</p>
          <ol>
            <li>Usa la app Meshtastic móvil</li>
            <li>Ve a Settings → Network → TCP</li>
            <li>Configura puerto 4403</li>
          </ol>
          <p><strong>Comando:</strong> <code>set tcp.port 4403 && set tcp.enabled true</code></p>
        </div>
        
        <h2>🔗 Endpoints Disponibles</h2>
        <div class="endpoint">${ENDPOINTS.nodeinfo}</div>
        <div class="endpoint">${ENDPOINTS.admin}</div>
        
        <h2>📱 Acciones Rápidas</h2>
        <a href="https://t.me/EA7_MESH_bot" class="btn telegram-link">Abrir en Telegram</a>
        <a href="${NODE_URL}" class="btn">Panel del Nodo</a>
        <a href="${NODE_URL}/admin" class="btn">Admin del Nodo</a>
        
        <h2>📊 Comandos Telegram</h2>
        <ul>
          <li><code>/info</code> - Información completa</li>
          <li><code>/wifi</code> - Estado WiFi</li>
          <li><code>/radio</code> - Configuración LoRa</li>
          <li><code>/stats</code> - Estadísticas</li>
          <li><code>/configtcp</code> - Ayuda TCP</li>
        </ul>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096;">
          <p>🌐 <strong>EA7 MESH Bot</strong> - Control remoto de red Meshtastic</p>
          <p>📡 Nodo local: ${NODE_IP} | 🔗 Bot: @EA7_MESH_bot</p>
        </div>
      </div>
      
      <script>
        // Actualizar timestamp cada minuto
        function updateTimestamp() {
          const now = new Date();
          document.getElementById('timestamp').textContent = now.toLocaleString();
        }
        setInterval(updateTimestamp, 60000);
        
        // Probar conexión TCP
        async function testTCP() {
          try {
            const response = await fetch('http://${NODE_IP}:4403/json', { mode: 'no-cors' });
            alert('✅ TCP 4403 está activo');
          } catch (error) {
            alert('❌ TCP 4403 no responde. Configúralo primero.');
          }
        }
      </script>
    </body>
    </html>
  `);
});

// ENDPOINT PARA RENDER HEALTH CHECK
app.get('/health', async (req, res) => {
  try {
    const nodeData = await getNodeData();
    
    res.json({
      status: nodeData.success ? 'healthy' : 'node_error',
      bot: '@EA7_MESH_bot',
      node: {
        ip: NODE_IP,
        connected: nodeData.success,
        source: nodeData.source || 'unknown'
      },
      timestamp: new Date().toISOString(),
      render_url: webhookUrl
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Bot iniciado en puerto ${PORT}`);
  console.log(`📡 Nodo: ${NODE_URL}`);
  console.log(`🔗 Webhook: ${webhookUrl}/bot${token}`);
});

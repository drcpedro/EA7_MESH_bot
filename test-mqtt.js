console.log('🧪 Probando conexión MQTT EA7!...');

const mqtt = require('mqtt');

const client = mqtt.connect({
  host: 'mqtt.meshtastic.pt',
  port: 8883,
  username: 'EA7!',
  password: 'PTEA7!',
  rejectUnauthorized: false
});

client.on('connect', () => {
  console.log('✅ CONEXIÓN EXITOSA!');
  console.log('El puerto 8883 está accesible');
  client.end();
  process.exit(0);
});

client.on('error', (err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏱️ Timeout');
  process.exit(1);
}, 10000);

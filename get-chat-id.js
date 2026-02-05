const TelegramBot = require('node-telegram-bot-api');
const token = '8482781617:AAFrS2W5SpHM-Ksx1N8oVrVHE0mbMhL3as8';
console.log('🔧 Usando token:', token.substring(0, 10) + '...');

const bot = new TelegramBot(token, { polling: true });

console.log('📱 ENVÍA UN MENSAJE A TU BOT EN TELEGRAM...');
console.log('1. Abre Telegram en tu teléfono');
console.log('2. Busca tu bot');
console.log('3. Envíale "hola" o cualquier mensaje');
console.log('='.repeat(50));

bot.on('message', (msg) => {
  console.log('\n' + '='.repeat(50));
  console.log('✅ ¡CHAT ID ENCONTRADO!');
  console.log('='.repeat(50));
  console.log('📋 Chat ID:', msg.chat.id);
  console.log('👤 Nombre:', msg.from.first_name || 'Usuario');
  console.log('='.repeat(50));
  console.log('\n🔥 COPIA ESTE NÚMERO:');
  console.log('   ' + msg.chat.id);
  console.log('\n💡 Pégalo en Render como TELEGRAM_CHAT_ID');
  
  bot.sendMessage(msg.chat.id, `✅ Tu Chat ID es: ${msg.chat.id}\n\nCópialo y pégalo en Render.`);
  
  setTimeout(() => {
    console.log('\n🎯 Script finalizado. ¡Ya tienes el Chat ID!');
    process.exit(0);
  }, 5000);
});

setTimeout(() => {
  console.log('\n⏱️ No recibí mensaje en 60 segundos.');
  console.log('Verifica:');
  console.log('1. Tu bot existe (@BotFather)');
  console.log('2. Le enviaste un mensaje');
  console.log('3. El token es correcto');
  process.exit(1);
}, 60000);

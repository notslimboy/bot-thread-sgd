const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('✅ Bot is running and online!');
});

app.listen(3000, () => {
  console.log('🌐 Web server aktif di port 3000');
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ID channel #general
const GENERAL_CHANNEL_ID = '1096456366916378737';

// Tambahkan semua parent thread channel di sini:
const SHARE_LOKER_PARENT_ID = '1096744274801995786';
const SHARE_EVENT_PARENT_ID = '1096559052085018744';
const SHARE_PORTO_PARENT_ID = '1117363602316337243';
const DEVLOG_PARENT_ID = '1106352627589066753';

const ALLOWED_PARENT_IDS = [
  SHARE_LOKER_PARENT_ID,
  SHARE_EVENT_PARENT_ID,
  SHARE_PORTO_PARENT_ID,
  DEVLOG_PARENT_ID
];

client.on('ready', () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  console.log(`[DEBUG] Pesan dari: ${message.channel.name} (ID: ${message.channel.id}) oleh ${message.author.username}`);

  if (!message.channel.isThread() || message.author.bot) return;

  const parentId = message.channel.parentId;
  console.log(`[DEBUG] Thread parent ID: ${parentId}`);

  if (!ALLOWED_PARENT_IDS.includes(parentId)) {
    console.log(`[DEBUG] Thread ini bukan dari channel yang diizinkan`);
    return;
  }

  try {
    const generalChannel = await client.channels.fetch(GENERAL_CHANNEL_ID);
    if (generalChannel && generalChannel.isTextBased()) {
      console.log(`[DEBUG] Mengirim notifikasi ke #general...`);
      await generalChannel.send(`📢 Pesan baru di thread **${message.channel.name}** (dari <#${parentId}>) oleh ${message.author.username}:\n"${message.content}"`);
    }
  } catch (error) {
    console.error('❌ Gagal kirim ke general:', error);
  }
});

client.login(process.env.TOKEN);

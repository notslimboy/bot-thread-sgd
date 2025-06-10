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

// Ganti dengan ID channel #general kamu
const GENERAL_CHANNEL_ID = '1096456366916378737';

// Ganti dengan ID channel INDUK tempat thread berasal
const SHARE_LOKER_PARENT_ID = '1096744274801995786';
const SHARE_EVENT_PARENT_ID = '1096559052085018744';

const ALLOWED_PARENT_IDS = [
  SHARE_LOKER_PARENT_ID,
  SHARE_EVENT_PARENT_ID
];

client.on('ready', () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // DEBUG
  console.log(`[DEBUG] Pesan dari: ${message.channel.name} (ID: ${message.channel.id}) oleh ${message.author.username}`);

  // Hanya respon kalau ini pesan dari thread
  if (!message.channel.isThread() || message.author.bot) return;

  const parentId = message.channel.parentId;

  // DEBUG
  console.log(`[DEBUG] Thread parent ID: ${parentId}`);

  // Cek apakah thread berasal dari parent yang diizinkan
  if (!ALLOWED_PARENT_IDS.includes(parentId)) {
    console.log(`[DEBUG] Thread ini bukan dari Share Loker/Event`);
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
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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
const GENERAL_CHANNEL_ID = '1381922366522916958';

// ID parent thread channels
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
  const parentChannel = message.channel.parent;

  console.log(`[DEBUG] Thread parent ID: ${parentId}`);

  // Filter hanya thread dari channel yang diizinkan
  if (!ALLOWED_PARENT_IDS.includes(parentId)) {
    console.log(`[DEBUG] Thread ini bukan dari channel yang diizinkan`);
    return;
  }

  // Abaikan jika ini reply (comment ke post)
  if (message.reference) {
    console.log(`[DEBUG] Ini reply ke pesan lain, diabaikan`);
    return;
  }

  // Cek apakah ini adalah pesan pertama di thread
  try {
    const fetchedMessages = await message.channel.messages.fetch({ limit: 2 });
    const sorted = [...fetchedMessages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const firstMessage = sorted[0];

    if (message.id !== firstMessage.id) {
      console.log(`[DEBUG] Ini bukan post pertama di thread, diabaikan`);
      return;
    }

    // Kirim embed ke general
    const generalChannel = await client.channels.fetch(GENERAL_CHANNEL_ID);
    if (generalChannel && generalChannel.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📢 New Post')
        .addFields(
          { name: 'Channel', value: `<#${parentId}>`, inline: true },
          { name: 'Thread', value: message.channel.name, inline: true },
          { name: 'Author', value: message.author.username, inline: true },
          { name: 'Content', value: message.content || '*No content*' }
        )
        .setTimestamp()
        .setFooter({ text: 'BOT SGD' });

      console.log(`[DEBUG] Mengirim embed ke #general...`);
      await generalChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('❌ Gagal kirim ke general:', error);
  }
});

client.login(process.env.TOKEN);

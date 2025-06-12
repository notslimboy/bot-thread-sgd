// === IMPORT MODULES ===
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch'); // Untuk ambil meme dari Reddit
require('dotenv').config();

// === SETUP EXPRESS SERVER (agar Replit tetap nyala via ping) ===
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('✅ Bot is running & online!'));
app.listen(3000, () => console.log('🌐 Web server aktif di port 3000'));

// === INISIALISASI DISCORD CLIENT DENGAN INTENTS YANG DIPERLUKAN ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,             // Diperlukan untuk koneksi ke guild
    GatewayIntentBits.GuildMessages,      // Untuk mendeteksi messageCreate
    GatewayIntentBits.MessageContent      // Supaya bisa baca isi pesan
  ]
});

// === KONFIGURASI ID CHANNEL ===
const GENERAL_CHANNEL_ID = '1096456366916378737';        // Channel notifikasi thread
const MEME_CHANNEL_ID    = '1096719332001710160';  // Channel untuk kirim meme otomatis

// ID semua channel INDUK tempat thread boleh muncul
const PARENT_IDS = [
  '1096744274801995786', // Share Loker
  '1096559052085018744', // Share Event
  '1117363602316337243', // Share Porto
  '1106352627589066753'  // Devlog
];

// === FUNGSI AMBIL MEME DARI REDDIT ===
async function fetchMeme() {
  const subreddits = ['GameDevMemes', 'ProgrammerHumor'];
  const sub = subreddits[Math.floor(Math.random() * subreddits.length)];

  const res = await fetch(`https://www.reddit.com/r/${sub}/random/.json`);
  const data = await res.json();

  const post = data[0]?.data?.children[0]?.data;
  if (!post || post.over_18 || !post.url) return null;

  return {
    title: post.title,
    url: post.url,
    permalink: `https://reddit.com${post.permalink}`
  };
}

// === FUNGSI KIRIM MEME KE CHANNEL MEME ===
async function postMeme() {
  try {
    const meme = await fetchMeme();
    if (!meme) throw new Error('No meme fetched');

    const channel = await client.channels.fetch(MEME_CHANNEL_ID);
    if (!channel.isTextBased()) throw new Error('Invalid meme channel');

    const embed = new EmbedBuilder()
      .setTitle(meme.title)
      .setURL(meme.permalink)
      .setImage(meme.url)
      .setColor(0x00ff00)
      .setFooter({ text: 'Meme Bot • r/GameDevMemes / r/ProgrammerHumor' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log('[Meme] Meme posted:', meme.title);
  } catch (err) {
    console.error('[Meme] Gagal posting meme:', err);
  }
}

// === JADWALKAN MEME TIAP 24-48 JAM (ACAK) ===
function scheduleMeme() {
  const delay = (24 + Math.random() * 24) * 60 * 60 * 1000;
  console.log(`[Meme] Next meme in ${(delay / (60*60*1000)).toFixed(1)} hrs`);
  setTimeout(async () => {
    await postMeme();
    scheduleMeme(); // recursive untuk terus menjadwalkan
  }, delay);
}

// === SAAT BOT SIAP ===
client.once('ready', () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
  scheduleMeme(); // mulai siklus meme
});

// === DETEKSI PESAN BARU DI THREAD UNTUK NOTIFIKASI ===
client.on('messageCreate', async (message) => {
  console.log(`[DEBUG] Pesan dari: ${message.channel.name} (ID: ${message.channel.id}) oleh ${message.author.username}`);

  // Hanya proses pesan di thread, dan bukan dari bot
  if (!message.channel.isThread() || message.author.bot) return;

  const parentId = message.channel.parentId;
  const parentChannel = message.channel.parent;

  // Hanya izinkan thread dari channel induk yang ditentukan
  if (!PARENT_IDS.includes(parentId)) {
    console.log(`[DEBUG] Thread ini bukan dari channel yang diizinkan`);
    return;
  }

  // Abaikan jika pesan ini adalah reply ke pesan lain
  if (message.reference) {
    console.log(`[DEBUG] Ini reply ke pesan lain, diabaikan`);
    return;
  }

  // Ambil 2 pesan pertama di thread dan sort berdasarkan waktu
  try {
    const fetchedMessages = await message.channel.messages.fetch({ limit: 2 });
    const sorted = [...fetchedMessages.values()].sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    const firstMessage = sorted[0];

    // Hanya proses jika pesan ini adalah post pertama
    if (message.id !== firstMessage.id) {
      console.log(`[DEBUG] Ini bukan post pertama di thread, diabaikan`);
      return;
    }

    // Kirim embed notifikasi ke general
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

      await generalChannel.send({ embeds: [embed] });
      console.log(`[DEBUG] Notifikasi dikirim ke #general`);
    }
  } catch (error) {
    console.error('❌ Error saat proses thread notifikasi:', error);
  }
});


// === Trigger Manual "!meme" dari Channel Meme Saja ===
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.toLowerCase() === '!meme' && message.channel.id === MEME_CHANNEL_ID) {
    message.reply('📤 Posting meme sekarang...');
    await postMeme();
  }
});

// === LOGIN BOT ===
client.login(process.env.TOKEN);

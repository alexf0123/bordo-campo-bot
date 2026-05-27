const config = require("../config");

const userMessages = new Map();
const STAFF_LOG_CHANNEL_ID = config.CHANNELS.STAFF_LOGS;

const BAD_SHORT_MESSAGES = new Set([
  "ok",
  "si",
  "sì",
  "no",
  "gg",
  "lol",
  "asd",
  "boh",
  "ciao",
  "hi",
  "ehi",
  "yo",
  ".",
  "..",
  "...",
  "👍",
  "😂",
  "🤣",
  "❤️",
  "🔥",
]);

function normalize(content) {
  return String(content || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function onlyEmojiOrSymbols(content) {
  const raw = String(content || "").replace(/\s/g, "");
  if (!raw) return false;

  const withoutLettersNumbers = raw.replace(/[0-9a-zA-ZÀ-ÿ]/g, "");
  return withoutLettersNumbers.length === raw.length;
}

function hasSuspiciousLink(content) {
  const text = normalize(content);

  return (
    text.includes("http://") ||
    text.includes("https://") ||
    text.includes("discord.gg/") ||
    text.includes("discord.com/invite/") ||
    text.includes("t.me/")
  );
}

async function logStaff(message, text) {
  try {
    const mainGuild = await message.client.guilds
      .fetch(config.MAIN_GUILD_ID)
      .catch(() => null);

    const logChannel = await mainGuild?.channels
      .fetch(STAFF_LOG_CHANNEL_ID)
      .catch(() => null);

    if (!logChannel) return;

    await logChannel.send({ content: text }).catch(() => null);
  } catch {}
}

async function checkAntiSpam(message) {
  if (!message.guild) return { allowed: false, giveXp: false, reason: "no_guild" };
  if (message.author.bot) return { allowed: false, giveXp: false, reason: "bot" };

  const content = normalize(message.content);
  const now = Date.now();
  const userId = message.author.id;

  if (!content || content.length === 0) {
    return { allowed: true, giveXp: false, reason: "empty" };
  }

  if (content.length < 4) {
    return { allowed: true, giveXp: false, reason: "too_short" };
  }

  if (BAD_SHORT_MESSAGES.has(content)) {
    return { allowed: true, giveXp: false, reason: "low_quality_short" };
  }

  if (onlyEmojiOrSymbols(message.content)) {
    return { allowed: true, giveXp: false, reason: "emoji_only" };
  }

  if (hasSuspiciousLink(content)) {
    await message.delete().catch(() => null);

    await logStaff(
      message,
      [
        "🚨 **LINK/SPAM RILEVATO**",
        `Utente: ${message.author.tag} (${message.author.id})`,
        `Server: ${message.guild.name}`,
        `Canale: <#${message.channel.id}>`,
        `Messaggio eliminato: \`${message.content.slice(0, 300)}\``,
      ].join("\n")
    );

    return { allowed: false, giveXp: false, reason: "suspicious_link_deleted" };
  }

  const history = userMessages.get(userId) || [];
  const recent = history.filter((entry) => now - entry.timestamp <= 15000);

  recent.push({
    timestamp: now,
    content,
    channelId: message.channel.id,
    messageId: message.id,
  });

  userMessages.set(userId, recent);

  const last5Seconds = recent.filter((entry) => now - entry.timestamp <= 5000);
  const last10Seconds = recent.filter((entry) => now - entry.timestamp <= 10000);
  const repeated = recent.filter((entry) => entry.content === content);

  if (repeated.length >= 3) {
    await message.delete().catch(() => null);

    await logStaff(
      message,
      [
        "🚨 **MESSAGGI RIPETUTI RILEVATI**",
        `Utente: ${message.author.tag} (${message.author.id})`,
        `Server: ${message.guild.name}`,
        `Canale: <#${message.channel.id}>`,
        `Messaggio eliminato: \`${message.content.slice(0, 300)}\``,
        "Azione: no XP + cancellazione messaggio",
      ].join("\n")
    );

    return { allowed: false, giveXp: false, reason: "repeated_deleted" };
  }

  if (last10Seconds.length >= 5) {
    await message.delete().catch(() => null);

    await logStaff(
      message,
      [
        "🚨 **FLOOD RILEVATO**",
        `Utente: ${message.author.tag} (${message.author.id})`,
        `Server: ${message.guild.name}`,
        `Canale: <#${message.channel.id}>`,
        "Motivo: 5 messaggi in 10 secondi",
        "Azione: messaggio eliminato + no XP",
      ].join("\n")
    );

    return { allowed: false, giveXp: false, reason: "flood_deleted" };
  }

  if (last5Seconds.length >= 3) {
    await logStaff(
      message,
      [
        "⚠️ **WARNING FLOOD**",
        `Utente: ${message.author.tag} (${message.author.id})`,
        `Server: ${message.guild.name}`,
        `Canale: <#${message.channel.id}>`,
        "Motivo: 3 messaggi in 5 secondi",
        "Azione: no XP sul messaggio",
      ].join("\n")
    );

    return { allowed: true, giveXp: false, reason: "flood_warning" };
  }

  return { allowed: true, giveXp: true, reason: "valid" };
}

module.exports = {
  checkAntiSpam,
};

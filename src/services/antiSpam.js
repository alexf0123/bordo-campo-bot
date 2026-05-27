const config = require("../config");

const userMessages = new Map();

const STAFF_LOG_CHANNEL_ID = config.CHANNELS.STAFF_LOGS;

// Ruolo staff principale Bordo Campo
const MAIN_STAFF_ROLE_ID = "1498341567105339492";

// Ruoli autorizzati a inviare link divisi per server
const LINK_ALLOWED_ROLES_BY_GUILD = {
  // REAL RP
  "1396149371468251236": [
    "1496549900765368481",
    "1496550265241866541",
    "1496550821050192024",
  ],

  // BC FC
  "1392747701308751943": [
    "1398358193197027408",
  ],

  // RPCI
  "1396908861566353479": [
    "1398225204404289669",
    "1507735305279635610",
  ],
};

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

async function hasAnyRole(message, roleIds) {
  try {
    if (!message.guild || !message.author) return false;

    if (message.member?.roles?.cache) {
      const hasCachedRole = roleIds.some((roleId) =>
        message.member.roles.cache.has(roleId)
      );

      if (hasCachedRole) return true;
    }

    const fetchedMember = await message.guild.members
      .fetch(message.author.id)
      .catch(() => null);

    if (!fetchedMember?.roles?.cache) return false;

    return roleIds.some((roleId) => fetchedMember.roles.cache.has(roleId));
  } catch {
    return false;
  }
}

async function canSendLinks(message) {
  const guildId = message.guild?.id;

  const allowedRoles = [
    MAIN_STAFF_ROLE_ID,
    ...(LINK_ALLOWED_ROLES_BY_GUILD[guildId] || []),
  ];

  return hasAnyRole(message, allowedRoles);
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
    text.includes("t.me/") ||
    text.includes("www.")
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

  const linkAllowed = await canSendLinks(message);

  // Bypass link per ruoli autorizzati.
  // Chi ha uno dei ruoli configurati può inviare link senza cancellazione.
  if (linkAllowed && hasSuspiciousLink(content)) {
    return { allowed: true, giveXp: true, reason: "authorized_link_allowed" };
  }

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
        `Server: ${message.guild.name} (${message.guild.id})`,
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
        `Server: ${message.guild.name} (${message.guild.id})`,
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
        `Server: ${message.guild.name} (${message.guild.id})`,
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
        `Server: ${message.guild.name} (${message.guild.id})`,
        `Canale: <#${message.channel.id}>`,
        "Motivo: 3 messaggi in 5 secondi",
        "Azione: no XP sul messaggio",
      ].join("\n")
    );

    return { allowed: true, giveXp: false, reason: "flood_warning" };
  }

  return {
    allowed: true,
    giveXp: true,
    reason: linkAllowed ? "valid_authorized_role" : "valid",
  };
}

module.exports = {
  checkAntiSpam,
};

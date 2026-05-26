const supabase = require("../database");
const config = require("../config");

function calculateLevel(xp) {
  let level = 0;

  for (const lvl in config.LEVEL_XP) {
    if (xp >= config.LEVEL_XP[lvl]) {
      level = Number(lvl);
    }
  }

  return level;
}

async function getOrCreateUser(userId) {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (user) return user;

  if (error && error.code !== "PGRST116") {
    console.error("❌ Supabase SELECT error:", error);
    return null;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("users")
    .insert({
      user_id: userId,
      xp: 0,
      level: 0,
      messages: 0,
      streak: 0,
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error("❌ Supabase INSERT user error:", insertError);
    return null;
  }

  return inserted;
}

async function updateLevelRole(client, userId, newLevel) {
  const mainGuild = await client.guilds.fetch(config.MAIN_GUILD_ID).catch(() => null);
  if (!mainGuild) return;

  const member = await mainGuild.members.fetch(userId).catch(() => null);
  if (!member) return;

  const allLevelRoles = Object.values(config.LEVEL_ROLES);
  await member.roles.remove(allLevelRoles).catch(() => null);

  const roleId = config.LEVEL_ROLES[newLevel];
  if (roleId) await member.roles.add(roleId).catch(() => null);
}

async function sendLevelUpNotifications(client, discordUser, newLevel, newXP, reason) {
  const mainGuild = await client.guilds.fetch(config.MAIN_GUILD_ID).catch(() => null);
  if (!mainGuild) return;

  const levelChannel = await mainGuild.channels.fetch(config.CHANNELS.LEVELS).catch(() => null);
  const staffLogs = await mainGuild.channels.fetch(config.CHANNELS.STAFF_LOGS).catch(() => null);

  if (levelChannel) {
    await levelChannel.send({
      content: `🎉 GG ${discordUser}, hai raggiunto il **LIVELLO ${newLevel}**!\n⭐ XP Totali: **${newXP}**`,
    }).catch(() => null);
  }

  try {
    await discordUser.send(
      `🎉 Complimenti! Hai raggiunto il **LIVELLO ${newLevel}** su **BORDO CAMPO**.\n⭐ XP Totali: ${newXP}`
    );
  } catch (err) {}

  if (staffLogs) {
    await staffLogs.send(
      `📈 **LEVEL UP**\nUtente: ${discordUser.tag} (${discordUser.id})\nNuovo livello: ${newLevel}\nXP: ${newXP}\nMotivo: ${reason}`
    ).catch(() => null);
  }
}

async function addXP({
  client,
  user,
  amount,
  reason = "Attività",
  sourceGuildId = null,
  incrementMessages = false,
}) {
  if (!user || user.bot) return null;
  if (!amount || amount <= 0) return null;

  const dbUser = await getOrCreateUser(user.id);
  if (!dbUser) return null;

  const oldXP = dbUser.xp || 0;
  const oldLevel = dbUser.level || 0;
  const newXP = oldXP + amount;
  const newLevel = calculateLevel(newXP);

  const updatePayload = {
    xp: newXP,
    level: newLevel,
    last_message_at: new Date().toISOString(),
  };

  if (incrementMessages) {
    updatePayload.messages = (dbUser.messages || 0) + 1;
  }

  const { error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("user_id", user.id);

  if (error) {
    console.error("❌ Supabase UPDATE XP error:", error);
    return null;
  }

  console.log("✅ XP aggiornati:", {
    user: user.tag,
    amount,
    reason,
    sourceGuildId,
    oldXP,
    newXP,
    oldLevel,
    newLevel,
  });

  if (newLevel > oldLevel) {
    await updateLevelRole(client, user.id, newLevel);
    await sendLevelUpNotifications(client, user, newLevel, newXP, reason);
  }

  return { oldXP, newXP, oldLevel, newLevel };
}

module.exports = {
  addXP,
  calculateLevel,
};

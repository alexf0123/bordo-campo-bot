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

async function updateLevelRole(message, newLevel) {
  const mainGuild = await message.client.guilds.fetch(config.MAIN_GUILD_ID).catch(() => null);
  if (!mainGuild) return;

  const member = await mainGuild.members.fetch(message.author.id).catch(() => null);
  if (!member) return;

  const levelRoleIds = Object.values(config.LEVEL_ROLES);

  await member.roles.remove(levelRoleIds).catch(() => null);

  const newRoleId = config.LEVEL_ROLES[newLevel];
  if (newRoleId) {
    await member.roles.add(newRoleId).catch(() => null);
  }
}

module.exports = async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (!config.LINKED_GUILDS.includes(message.guild.id)) return;

  const userId = message.author.id;

  let gainedXP = config.XP_RULES.OTHER_MESSAGE_XP;

  if (message.guild.id === config.MAIN_GUILD_ID) {
    gainedXP = config.XP_RULES.MAIN_MESSAGE_XP;
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!user) {
    const firstXP = gainedXP;
    const firstLevel = calculateLevel(firstXP);

    await supabase.from("users").insert({
      user_id: userId,
      xp: firstXP,
      level: firstLevel,
      messages: 1,
      last_message_at: new Date().toISOString(),
    });

    return;
  }

  const newXP = (user.xp || 0) + gainedXP;
  const newMessages = (user.messages || 0) + 1;
  const oldLevel = user.level || 0;
  const newLevel = calculateLevel(newXP);

  await supabase
    .from("users")
    .update({
      xp: newXP,
      messages: newMessages,
      level: newLevel,
      last_message_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (newLevel > oldLevel) {
    await updateLevelRole(message, newLevel);

    const mainGuild = await message.client.guilds.fetch(config.MAIN_GUILD_ID).catch(() => null);
    const levelChannel = mainGuild?.channels.cache.get(config.CHANNELS.LEVELS);
    const staffLogs = mainGuild?.channels.cache.get(config.CHANNELS.STAFF_LOGS);

    if (levelChannel) {
      await levelChannel.send({
        content: `🎉 GG ${message.author}, hai raggiunto il **LIVELLO ${newLevel}**!\nXP Totali: **${newXP}**`,
      }).catch(() => null);
    }

    try {
      await message.author.send(
        `🎉 Complimenti! Hai raggiunto il **LIVELLO ${newLevel}** su **BORDO CAMPO**.\nXP Totali: ${newXP}`
      );
    } catch (err) {}

    if (staffLogs) {
      await staffLogs.send(
        `📈 **LEVEL UP**\nUtente: ${message.author.tag} (${message.author.id})\nNuovo livello: ${newLevel}\nXP: ${newXP}`
      ).catch(() => null);
    }
  }
};

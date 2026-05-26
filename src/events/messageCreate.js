const supabase = require("../database");
const config = require("../config");

module.exports = async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  const userId = message.author.id;

  let gainedXP = 0;

  // SERVER PRINCIPALE
  if (message.guild.id === config.MAIN_GUILD_ID) {
    gainedXP = 2;
  }

  // REAL RP
  if (message.guild.id === "1396149371468251236") {
    gainedXP = 1;
  }

  // RPCI
  if (message.guild.id === "1396908861566353479") {
    gainedXP = 1;
  }

  // BC FC26
  if (message.guild.id === "1392747701308751943") {
    gainedXP = 1;
  }

  if (gainedXP <= 0) return;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!user) {
    await supabase.from("users").insert({
      user_id: userId,
      xp: gainedXP,
      level: 0,
      messages: 1,
      last_active: Date.now(),
    });

    return;
  }

  const newXP = user.xp + gainedXP;

  let newLevel = user.level;

  for (const level in config.LEVEL_XP) {
    if (newXP >= config.LEVEL_XP[level]) {
      newLevel = Number(level);
    }
  }

  await supabase
    .from("users")
    .update({
      xp: newXP,
      level: newLevel,
      messages: user.messages + 1,
      last_active: Date.now(),
    })
    .eq("user_id", userId);

  if (newLevel > user.level) {
    console.log(`${message.author.tag} è salito al livello ${newLevel}`);
  }
};

require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
} = require("discord.js");

require("./database");

const config = require("./config");
const messageCreate = require("./events/messageCreate");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
  ],
});

client.once("clientReady", () => {
  console.log(`✅ Bot online come ${client.user.tag}`);
  console.log("✅ Supabase collegato");
});

client.on("messageCreate", messageCreate);

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const supabase = require("./database");

  if (interaction.commandName === "profilo") {
    const userId = interaction.user.id;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!user) {
      return interaction.reply({
        content: "Non hai ancora dati XP. Scrivi qualche messaggio valido per iniziare.",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle(`📈 Profilo di ${interaction.user.username}`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Livello", value: `${user.level || 0}`, inline: true },
        { name: "XP Totali", value: `${user.xp || 0}`, inline: true },
        { name: "Messaggi", value: `${user.messages || 0}`, inline: true },
        { name: "Streak", value: `${user.streak || 0}`, inline: true },
      )
      .setFooter({ text: "Bordo Campo | Sistema Livelli" });

    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "classifica") {
    if (interaction.channelId !== config.CHANNELS.LEVELS) {
      return interaction.reply({
        content: "❌ Puoi usare `/classifica` solo nel canale LIVELLI.",
        ephemeral: true,
      });
    }

    const { data: users } = await supabase
      .from("users")
      .select("*")
      .order("xp", { ascending: false })
      .limit(10);

    if (!users || users.length === 0) {
      return interaction.reply("Nessun dato classifica disponibile.");
    }

    const text = users
      .map((u, i) => `**${i + 1}.** <@${u.user_id}> — Livello ${u.level || 0} — ${u.xp || 0} XP`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle("🏅 Classifica Globale BC")
      .setDescription(text)
      .setFooter({ text: "Bordo Campo | Leaderboard" });

    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "ticketpanel") {
    return interaction.reply({
      content: "🎫 Sistema ticket in preparazione nel prossimo step.",
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("❌ Errore login bot:", error);
});

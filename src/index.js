require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} = require("discord.js");

const interactionCreate = require("./events/interactionCreate");

console.log("✅ EVENTO interactionCreate IMPORTATO");

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

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot online come ${client.user.tag}`);
  console.log("✅ Sistema ticket caricato");
});

client.on(Events.InteractionCreate, async (interaction) => {
  await interactionCreate(interaction);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("❌ Errore login bot:", error);
});

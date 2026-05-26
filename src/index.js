require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  Events,
} = require("discord.js");

require("./database");

const config = require("./config");
const messageCreate = require("./events/messageCreate");
const interactionCreate = require("./events/interactionCreate");

console.log("✅ EVENTO messageCreate IMPORTATO");
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
  console.log("✅ Supabase collegato");
  console.log("✅ Server collegati caricati:", config.LINKED_GUILDS.join(", "));
});

client.on(Events.MessageCreate, async (message) => {
  await messageCreate(message);
});

client.on(Events.InteractionCreate, async (interaction) => {
  await interactionCreate(interaction, client);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("❌ Errore login bot:", error);
});

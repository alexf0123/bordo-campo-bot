require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
} = require("discord.js");

const config = require("./config");
const messageCreate = require("./events/messageCreate");
const interactionCreate = require("./events/interactionCreate");
const guildMemberUpdate = require("./events/guildMemberUpdate");

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
    Partials.GuildMember,
  ],
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot online come ${client.user.tag}`);
  console.log("✅ XP multi-server attivo");
  console.log("✅ Ticket system attivo");
  console.log("✅ Server collegati:", config.LINKED_GUILDS.join(", "));
});

client.on(Events.MessageCreate, async (message) => {
  await messageCreate(message);
});

client.on(Events.InteractionCreate, async (interaction) => {
  await interactionCreate(interaction);
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  await guildMemberUpdate(oldMember, newMember);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
  console.error("❌ Errore login bot:", error);
});

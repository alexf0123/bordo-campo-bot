require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User
  ]
});

client.commands = new Collection();

require("./src/events/interactionCreate")(client);

client.once("ready", () => {
  console.log(`✅ Bot online come ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);

// Startup
import "dotenv/config";

// Imports
import { Client, IntentsBitField } from "discord.js";
import { createStartupInfoFromEnvironment } from "./util/StartupHelper";
import { pino } from "pino";
import pretty from "pino-pretty";
import { CommandHandler } from "./core/CommandHandler";

const logger = pino(pretty());
const startup = createStartupInfoFromEnvironment();
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
    ]
});

const commandHandler = new CommandHandler(logger.child({ component: "CommandHandler" }));
commandHandler.subscribeEvents(client);

client.on("ready", (client) => {
    logger.info(`Logged in as '${client.user?.tag}' (ID: ${client.user?.id})`);
});

client.login(startup.discordToken);
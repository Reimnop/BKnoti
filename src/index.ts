// Startup
import "dotenv/config";

// Imports
import { Client, IntentsBitField } from "discord.js";
import { pino } from "pino";
import pretty from "pino-pretty";
import { createStartupInfoFromEnvironment } from "./util";
import { CommandHandler } from "./core";

// Commands
import { Ping, Authorize } from "./core/command";
import { AuthService } from "./service";

const logger = pino(pretty());
const startup = createStartupInfoFromEnvironment();
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
    ]
});

const authService = new AuthService(startup);
const commandHandler = new CommandHandler(
    logger.child({ component: "CommandHandler" }),
    function* () {
        yield ["ping", () => new Ping()];
        yield ["authorize", () => new Authorize(authService)];
    });
commandHandler.subscribeEvents(client);

client.on("ready", (client) => {
    logger.info(`Logged in as '${client.user?.tag}' (ID: ${client.user?.id})`);
});

client.login(startup.discordToken);
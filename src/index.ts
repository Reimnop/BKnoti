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
import { AuthService, DatabaseService } from "./service";
import { GetCalendars } from "./core/command/GetCalendars";

const logger = pino(pretty());
const startup = createStartupInfoFromEnvironment();
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
    ]
});

const databaseService = new DatabaseService();
const authService = new AuthService(logger.child({ component: "AuthService" }), databaseService, startup);
const commandHandler = new CommandHandler(
    logger.child({ component: "CommandHandler" }),
    [
        {
            type: "commandRegistration",
            name: "ping",
            description: "Ping the bot",
            command: () => new Ping()
        },
        {
            type: "commandRegistration",
            name: "authorize",
            description: "Authorize the bot to access your Google Calendar",
            command: () => new Authorize(authService),
        },
        {
            type: "subcommandRegistration",
            name: "calendar",
            description: "Manage your calendars",
            children: [
                {
                    type: "commandRegistration",
                    name: "get",
                    description: "Get your calendars",
                    command: () => new GetCalendars(authService, databaseService)
                }
            ]
        }
    ]
);

commandHandler.subscribeEvents(client);

client.on("ready", (client) => {
    logger.info(`Logged in as '${client.user?.tag}' (ID: ${client.user?.id})`);
});

client.login(startup.discordToken);
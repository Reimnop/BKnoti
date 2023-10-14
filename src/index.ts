// Startup
import 'dotenv/config';

// Imports
import { Client, IntentsBitField } from "discord.js";
import { createStartupInfoFromEnvironment } from "./util/StartupHelper";

const startup = createStartupInfoFromEnvironment();
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMembers,
    ]
});

client.login(startup.discordToken);
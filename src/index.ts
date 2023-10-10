// Startup
import 'dotenv/config';

// Imports
import { IntentsBitField } from "discord.js";
import { Client } from "discordx";
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
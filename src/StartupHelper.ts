import { StartupInfo } from "./data/StartupInfo";

export function createStartupInfoFromEnvironment(): StartupInfo {
    const discordToken = process.env.DISCORD_TOKEN;
    if (!discordToken) {
        throw new Error("DISCORD_TOKEN environment variable is not set.");
    }
    return {
        discordToken
    };
}
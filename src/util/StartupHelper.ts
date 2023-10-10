import { StartupInfo } from "../data/StartupInfo";

export function createStartupInfoFromEnvironment(): StartupInfo {
    const discordToken = getEnvironmentVariable("DISCORD_TOKEN");

    return {
        discordToken
    };
}

function getEnvironmentVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable ${name} is not set!`);
    }
    return value;
}
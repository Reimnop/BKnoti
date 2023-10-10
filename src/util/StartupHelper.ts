import { StartupInfo } from "../data/StartupInfo";

export function createStartupInfoFromEnvironment(): StartupInfo {
    return {
        discordToken: getEnvironmentVariable("DISCORD_TOKEN")
    };
}

function getEnvironmentVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable '${name}' is not set!`);
    }
    return value;
}
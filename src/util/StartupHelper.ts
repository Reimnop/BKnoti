import { StartupInfo } from "../data";

export function createStartupInfoFromEnvironment(): StartupInfo {
    return {
        discordToken: getEnvironmentVariable("DISCORD_TOKEN"),
        googleApiClientId: getEnvironmentVariable("GAPI_CLIENT_ID"),
        googleApiClientSecret: getEnvironmentVariable("GAPI_CLIENT_SECRET"),
        googleApiRedirectUri: getEnvironmentVariable("GAPI_REDIRECT_URI"),
        redirectPort: Number.parseInt(getEnvironmentVariable("REDIRECT_PORT"))
    };
}

function getEnvironmentVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Environment variable '${name}' is not set!`);
    }
    return value;
}
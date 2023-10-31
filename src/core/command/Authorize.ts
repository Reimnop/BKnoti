import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Command } from "../Command";
import { StartupInfo } from "../../data/StartupInfo";
import { google } from "googleapis";

export class Authorize implements Command {
    public readonly description: string = "Authorize a user to use the bot";

    private readonly startupInfo: StartupInfo;
    
    constructor(startupInfo: StartupInfo) {
        this.startupInfo = startupInfo;
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const oauth2Client = new google.auth.OAuth2(
            this.startupInfo.googleApiClientId,
            this.startupInfo.googleApiClientSecret,
            this.startupInfo.googleApiRedirectUri
        );
        const scopes = [
            "https://www.googleapis.com/auth/calendar.readonly"
        ];
        const url = oauth2Client.generateAuthUrl({
            access_type: "online",
            scope: scopes
        });
        await interaction.reply({
            ephemeral: true,
            content: `Please visit [this link](${url}) to authorize me.`
        });
    }

}
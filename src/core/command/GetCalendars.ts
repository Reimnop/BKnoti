import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Command } from "..";
import { AuthService, DatabaseService } from "../../service";
import { google } from "googleapis";

export class GetCalendars implements Command {
    private readonly authService: AuthService;
    private readonly databaseService: DatabaseService;

    constructor(authService: AuthService, databaseService: DatabaseService) {
        this.authService = authService;
        this.databaseService = databaseService;
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const user = await this.databaseService.getUser(interaction.user.id);
        if (!user) {
            await interaction.reply({
                ephemeral: true,
                content: "You were not authorized. Please authorize me by using the `/authorize` command."
            });
            return;
        }
        const oauth2Client = this.authService.getOauth2Client();
        oauth2Client.setCredentials({
            refresh_token: user.googleRefreshToken
        });
        const calendar = google.calendar({ 
            version: "v3", 
            auth: oauth2Client 
        });
        const calendars = await calendar.calendarList.list();
        let response = "Here are your calendars:\n";
        calendars.data.items?.forEach((calendar) => {
            response += `- ${calendar.summary}\n`;
        });
        await interaction.reply({
            ephemeral: true,
            content: response
        });
    }
}
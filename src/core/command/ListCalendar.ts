import { ChatInputCommandInteraction, CacheType, EmbedBuilder } from "discord.js";
import { Command } from "..";
import { AuthService, DatabaseService } from "../../service";
import { google } from "googleapis";

export class ListCalendar implements Command {
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
                content: "You were not authorized! Please authorize me by using the `/authorize` command."
            });
            return;
        }

        await interaction.deferReply({
            ephemeral: true
        }); // In case fetching from Google Calendar takes a while

        const oauth2Client = this.authService.getOAuth2Client(user.googleRefreshToken);
        const calendar = google.calendar({ 
            version: "v3", 
            auth: oauth2Client 
        });
        const response = await calendar.calendarList.list();
        const calendars = response.data.items;
        if (!calendars) {
            await interaction.editReply({
                content: "You don't have any calendars!"
            });
            return;
        }
        const embed = new EmbedBuilder()
            .setColor(0x5dff5d)
            .setTitle("Provided by Google Calendar")
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.avatarURL()!
            })
            .setDescription(calendars.map(calendar => `- ${calendar.summary} // id: \`${calendar.id}\``).join("\n"));
        await interaction.editReply({
            content: "Here are your calendars",
            embeds: [embed]
        });
    }
}
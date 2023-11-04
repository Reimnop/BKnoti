import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Command } from "..";
import { AuthService, DatabaseService } from "../../service";
import { google } from "googleapis";
import { DateTime } from "luxon";

export class SleepSchedule implements Command {
    private readonly authService: AuthService;
    private readonly databaseService: DatabaseService;

    constructor(authService: AuthService, databaseService: DatabaseService) {
        this.authService = authService;
        this.databaseService = databaseService;
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const user = await this.databaseService.getUser(interaction.user.id);
        if (!user) {
            await interaction.editReply({
                content: "You were not authorized! Please authorize me by using the `/authorize` command."
            });
            return;
        }
        if (!user.calendar) {
            await interaction.editReply({
                content: "You have not set a calendar! Please set a calendar by using the `/calendar use` command."
            });
            return;
        }
        const oauth2Client = this.authService.getOAuth2Client(user.googleRefreshToken);
        const calendarClient = google.calendar({
            version: "v3",
            auth: oauth2Client
        });
        const now = DateTime.now();
        const nextWeek = now.plus({ weeks: 1 });
        const calendarEventsResponse = await calendarClient.events.list({
            calendarId: user.calendar,
            orderBy: "startTime",
            singleEvents: true,
            timeMin: now.toISO(),
            timeMax: nextWeek.toISO()
        });
        if (calendarEventsResponse.status !== 200) {
            await interaction.editReply({
                content: "An error occurred while fetching your calendar!"
            });
            return;
        }
        const events = calendarEventsResponse.data;
        await interaction.editReply({
            files: [
                {
                    attachment: Buffer.from(JSON.stringify(events, null, 2)),
                    name: "calendar.json"
                }
            ]
        });
    }
}
import { ModalSubmitInteraction, CacheType } from "discord.js";
import { ModalHandler } from "..";
import { AuthService, DatabaseService } from "../../service";
import { google } from "googleapis";

export class UseCalendarModalHandler implements ModalHandler {
    private readonly authService: AuthService;
    private readonly databaseService: DatabaseService;

    constructor(authService: AuthService, databaseService: DatabaseService) {
        this.authService = authService;
        this.databaseService = databaseService;
    }

    async execute(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
        const user = await this.databaseService.getUser(interaction.user.id);
        if (!user) {
            // This shouldn't ever happen, but just in case
            await interaction.reply({
                ephemeral: true,
                content: "You were not authorized! Please authorize me by using the `/authorize` command."
            });
            return;
        }

        await interaction.deferReply({
            ephemeral: true
        }); // In case fetching from Google Calendar takes a while
        const oauth2Client = this.authService.getOauth2Client(user.googleRefreshToken);
        const calendar = google.calendar({ 
            version: "v3", 
            auth: oauth2Client 
        });
        const response = await calendar.calendarList.list();
        const calendars = response.data.items;
        const calendarId = interaction.fields.getTextInputValue("calendarIdInput");
        const selectedCalendar = calendars?.find(calendar => calendar.id === calendarId);
        if (!selectedCalendar) {
            await interaction.editReply({
                content: `The calendar with ID \`${calendarId}\` does not exist!`
            });
            return;
        }
        await this.databaseService.updateUserCalendar(interaction.user.id, selectedCalendar.id!);
        await interaction.editReply({
            content: `✅ The calendar has been successfully set to \`${selectedCalendar.summary}\`!\nYou will now receive notifications from this calendar.`
        });
    }
}
import { ChatInputCommandInteraction, CacheType, ModalBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder, ModalSubmitInteraction } from "discord.js";
import { Command } from "..";
import { AuthService, DatabaseService } from "../../service";
import { google } from "googleapis";

export class UseCalendar implements Command {
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
        const modal = new ModalBuilder()
            .setCustomId("useCalendarModal")
            .setTitle("Use Calendar");
        const calendarInput = new TextInputBuilder()
            .setCustomId("calendarInput")
            .setLabel("Which calendar do you want to use?")
            .setStyle(TextInputStyle.Short);
        const calendarInputActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
            .addComponents(calendarInput);
        modal.addComponents(calendarInputActionRow);
        await interaction.showModal(modal);

        const awaitSubmitFilter = (interaction: ModalSubmitInteraction) => interaction.customId === "useCalendarModal";
        const modalInteraction = await interaction.awaitModalSubmit({ filter: awaitSubmitFilter, time: 30000 }); // 30 seconds
        await modalInteraction.deferReply({
            ephemeral: true
        }); // In case fetching from Google Calendar takes a while
        const oauth2Client = this.authService.getOauth2Client(user.googleRefreshToken);
        const calendar = google.calendar({ 
            version: "v3", 
            auth: oauth2Client 
        });
        const response = await calendar.calendarList.list();
        const calendars = response.data.items;
        const calendarName = modalInteraction.fields.getTextInputValue("calendarInput");
        const selectedCalendar = calendars?.find(calendar => calendar.summary === calendarName);
        if (!selectedCalendar) {
            await modalInteraction.editReply({
                content: `The calendar \`${calendarName}\` does not exist!`
            });
            return;
        }
        await this.databaseService.updateUserCalendar(interaction.user.id, selectedCalendar.id!);
        await modalInteraction.editReply({
            content: `✅ Successfully set calendar to \`${selectedCalendar.summary}\`!`
        });
    }
}
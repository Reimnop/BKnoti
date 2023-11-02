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
            .setCustomId("calendarIdInput")
            .setLabel("Enter the calendar ID (use `/calendar list`)")
            .setStyle(TextInputStyle.Short);
        const calendarInputActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>()
            .addComponents(calendarInput);
        modal.addComponents(calendarInputActionRow);
        await interaction.showModal(modal);
    }
}
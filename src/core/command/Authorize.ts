import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Command } from "..";
import { AuthService, DatabaseService } from "../../service";
import { ALREADY_AUTHORIZED } from "../../util";

export class Authorize implements Command {
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
        if (user) {
            await interaction.editReply(ALREADY_AUTHORIZED);
            return;
        }
        const url = this.authService.getAuthUrl(interaction.user.id);
        await interaction.editReply({
            content: `Please visit [this link](${url}) to authorize me.`
        });
    }

}
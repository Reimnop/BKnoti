import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Command } from "..";
import { AuthService, DatabaseService } from "../../service";

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
            await interaction.editReply({
                content: "You are already authorized!"
            });
            return;
        }
        const url = this.authService.getAuthUrl(interaction.user.id);
        await interaction.editReply({
            content: `Please visit [this link](${url}) to authorize me.`
        });
    }

}
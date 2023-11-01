import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Command } from "..";
import { AuthService } from "../../service";

export class Authorize implements Command {
    private readonly authService: AuthService;
    
    constructor(authService: AuthService) {
        this.authService = authService;
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const url = this.authService.getAuthUrl(interaction.user.id);
        await interaction.reply({
            ephemeral: true,
            content: `Please visit [this link](${url}) to authorize me.`
        });
    }

}
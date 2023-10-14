import { Command } from "../Command";
import { Interaction } from "discord.js";

export class PingCommand implements Command {
    getDescription(): string {
        return "Pings the bot.";
    }

    async execute(interaction: Interaction): Promise<void> {
        await interaction.reply("Pong!");
    }
}

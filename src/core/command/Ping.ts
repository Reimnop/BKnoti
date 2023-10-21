import { type Command } from "../Command";
import { type ChatInputCommandInteraction, type InteractionReplyOptions } from "discord.js";

export class PingCommand implements Command {
    public readonly description: string = "Replies with 'Pong!'";

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const client = interaction.client;
        const replyOptions: InteractionReplyOptions = {
            ephemeral: true,
            content: `Pong! Latency: ${client.ws.ping}ms`
        };
        await interaction.reply(replyOptions);
    }
}

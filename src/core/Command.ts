import { ChatInputCommandInteraction } from "discord.js";

export interface Command {
    description: string;
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
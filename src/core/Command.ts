import { Interaction } from "discord.js";

export interface Command {
    getDescription(): string;
    execute(interaction: Interaction): Promise<void>;
}
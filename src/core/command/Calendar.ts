import { ChatInputCommandInteraction, CacheType } from "discord.js";
import { Command } from "../Command";
import { calendar_v3 } from "@googleapis/calendar";
import { GlobalOptions } from "googleapis-common";

export class Calendar implements Command {
    public readonly description: string = "squeee";

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        await interaction.reply("squeee");
    }
}
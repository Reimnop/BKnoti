import { ChatInputCommandInteraction, CacheType, Embed, EmbedBuilder } from "discord.js";
import { Command, CommandManager, CommandRegistry } from "..";
import fluent from "fluent-iterable";

export class Help implements Command {
    private readonly commandManager: CommandManager;

    constructor(commandManager: CommandManager) {
        this.commandManager = commandManager;
    }

    async execute(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        const commands = fluent(this.commandManager.commandRegistry.leafCommands);
        const embed = new EmbedBuilder()
            .setColor(0x5dff5d)
            .setTitle("List of Commands")
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.avatarURL()!
            })
            .setDescription(commands.map(command => `\`/${command.name.join(" ")}\` - ${command.description}`).join("\n"));
        await interaction.reply({
            embeds: [embed]
        });
    }

}
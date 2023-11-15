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
        const embedDescription = 
`**For first time users**\n
1. Import your calendar using [BKalendar](https://bkalendar.github.io/) into your Google Calendar.
2. Authorize the bot to access your Google Calendar using \`/authorize\`.
3. List your calendars using \`/calendar list\`.
4. Select the calendar you want to use using \`/calendar use\`.

**Available commands**\n
${commands.map(command => `\`/${command.name.join(" ")}\` - ${command.description}`).join("\n")}`;
        const embed = new EmbedBuilder()
            .setColor(0x5dff5d)
            .setAuthor({
                name: interaction.user.username,
                iconURL: interaction.user.avatarURL()!
            })
            .setDescription(embedDescription);
        await interaction.reply({
            embeds: [embed]
        });
    }

}
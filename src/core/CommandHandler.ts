import { Client, SlashCommandBuilder, ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { Logger } from "pino";
import { CommandRegistry } from "./CommandRegistry";
import { PingCommand } from "./command/Ping";

export class CommandHandler {
    private readonly logger: Logger;
    private commandRegistry: CommandRegistry | null = null;

    constructor(logger: Logger) {
        this.logger = logger;
    }

    public registerCommands(): void {
        const registry = new CommandRegistry();
        registry.registerCommand("ping", () => new PingCommand());

        registry.lock();
        this.commandRegistry = registry;
    }

    public subscribeEvents(client: Client): void {
        client.on("ready", () => {
            if (!this.commandRegistry)
                throw new Error("Command registry is not initialized!");

            const commands = [...CommandHandler.iterateCommandData(this.commandRegistry)];
            const application = client.application;
            if (!application)
                throw new Error("Application is not initialized!");
            
            application.commands.set(commands);

            this.logger.info(`Registered ${this.commandRegistry.count()} slash commands.`);
        });

        client.on("interactionCreate", async (interaction) => {
            if (!this.commandRegistry)
                throw new Error("Command registry is not initialized!");

            if (!interaction.isCommand())
                return;

            if (!(interaction instanceof ChatInputCommandInteraction))
                return;

            const command = this.commandRegistry.getCommand(interaction.commandName);
            if (!command)
                return;

            await command.execute(interaction);
        });
    }

    private static* iterateCommandData(commandRegistry: CommandRegistry): Generator<RESTPostAPIChatInputApplicationCommandsJSONBody> {
        for (const [name, command] of commandRegistry) {
            const slashCommandBuilder = new SlashCommandBuilder()
                .setName(name)
                .setDescription(command.description);
            yield slashCommandBuilder.toJSON();
        }
    }
}
import { Client, SlashCommandBuilder, ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import { Logger } from "pino";
import { CommandRegistry } from "./CommandRegistry";
import { Ping } from "./command/Ping";
import { Authorize } from "./command/Authorize";
import { StartupInfo } from "../data/StartupInfo";

export class CommandHandler {
    private readonly logger: Logger;
    private readonly commandRegistry: CommandRegistry;

    constructor(startupInfo: StartupInfo, logger: Logger) {
        this.logger = logger;
        this.commandRegistry = this.registerCommands(startupInfo);
    }

    private registerCommands(startupInfo: StartupInfo): CommandRegistry {
        const registry = new CommandRegistry()
            .registerCommand("ping", () => new Ping())
            .registerCommand("authorize", () => new Authorize(startupInfo))
            .lock();
            
        return registry;
    }

    public subscribeEvents(client: Client): void {
        client.on("ready", () => {
            const commands = [...CommandHandler.iterateCommandData(this.commandRegistry)];
            const application = client.application;
            if (!application)
                throw new Error("Application is not initialized!");
            
            application.commands.set(commands);

            this.logger.info(`Registered ${this.commandRegistry.count()} slash commands`);
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
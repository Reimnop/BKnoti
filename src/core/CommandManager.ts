import { Client, SlashCommandBuilder, ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody, SlashCommandSubcommandBuilder, SlashCommandSubcommandGroupBuilder, Events } from "discord.js";
import { Logger } from "pino";
import { CommandNode, CommandRegistry, SlashCommand, SubcommandGroupNode, SubcommandNode } from "./CommandRegistry";
import { Func, RuntimeType } from "../util";
import { Command } from "./Command";

export interface CommandRegistration extends RuntimeType {
    type: "commandRegistration";
    name: string;
    description: string;
    command: Func<Command>;
}

export interface SubcommandRegistration extends RuntimeType {
    type: "subcommandRegistration";
    name: string;
    description: string;
    children: CommandRegistration[];
}

export interface SubcommandGroupRegistration extends RuntimeType {
    type: "subcommandGroupRegistration";
    name: string;
    description: string;
    children: SubcommandRegistration[];
}

export type SlashCommandRegistration = CommandRegistration | SubcommandRegistration | SubcommandGroupRegistration;

export class CommandManager {
    public readonly commandRegistry: CommandRegistry;
    private readonly logger: Logger;

    constructor(logger: Logger, slashCommandRegistrations: SlashCommandRegistration[]) {
        this.logger = logger;
        this.commandRegistry = new CommandRegistry();
        for (const registration of slashCommandRegistrations)
            this.commandRegistry.registerSlashCommand(registration);
    }

    registerAdditionalCommands(slashCommandRegistrations: SlashCommandRegistration[]) {
        for (const registration of slashCommandRegistrations)
            this.commandRegistry.registerSlashCommand(registration);
    }

    lock() {
        this.commandRegistry.lock();
    }

    subscribeEvents(client: Client) {
        client.on(Events.ClientReady, () => {
            const commands = [...CommandManager.iterateCommandData(this.commandRegistry)];
            const application = client.application;
            if (!application)
                throw new Error("Application is not initialized!");
            application.commands.set(commands);
            this.logger.info(`Registered ${this.commandRegistry.count()} slash commands`);
        });

        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand())
                return;

            const commandName = CommandManager.getCommandName(interaction);
            const command = this.commandRegistry.getCommand(commandName);
            if (!command) {
                await interaction.reply("Error: Command not found!");
                return;
            }
            await command.execute(interaction);
        });
    }

    private static getCommandName(interaction: ChatInputCommandInteraction): string[] {
        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand(false);
        const command = interaction.commandName;
        if (subcommandGroup)
            return [command, subcommandGroup, subcommand!];
        if (subcommand)
            return [command, subcommand];
        return [command];
    }

    private static* iterateCommandData(commandRegistry: CommandRegistry): Generator<RESTPostAPIChatInputApplicationCommandsJSONBody> {
        for (const [name, node] of commandRegistry.slashCommands) {
            const slashCommandBuilder = new SlashCommandBuilder();
            this.buildSlashCommand(slashCommandBuilder, node);

            yield slashCommandBuilder.toJSON();
        }
    }

    private static buildSlashCommand(slashCommandBuilder: SlashCommandBuilder, node: SlashCommand) {
        switch (node.type) {
            case "commandNode":
                this.buildCommandNode(slashCommandBuilder, node);
                break;
            case "subcommandNode":
                this.buildSubcommandNode(slashCommandBuilder, node);
                break;
            case "subcommandGroupNode":
                this.buildSubcommandGroupNode(slashCommandBuilder, node);
                break;
            default:
                throw new Error("Unknown slash command type!");
        }
    }

    private static buildCommandNode(slashCommandBuilder: SlashCommandBuilder | SlashCommandSubcommandBuilder, node: CommandNode) {
        slashCommandBuilder.setName(node.name);
        slashCommandBuilder.setDescription(node.description);
    }

    private static buildSubcommandNode(slashCommandBuilder: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder, node: SubcommandNode) {
        slashCommandBuilder.setName(node.name);
        slashCommandBuilder.setDescription(node.description);
        for (const [name, child] of node.children) {
            const subcommandBuilder = new SlashCommandSubcommandBuilder();
            this.buildCommandNode(subcommandBuilder, child);
            slashCommandBuilder.addSubcommand(subcommandBuilder);
        }
    }

    private static buildSubcommandGroupNode(slashCommandBuilder: SlashCommandBuilder, node: SubcommandGroupNode) {
        slashCommandBuilder.setName(node.name);
        slashCommandBuilder.setDescription(node.description);
        for (const [name, child] of node.children) {
            const subcommandGroupBuilder = new SlashCommandSubcommandGroupBuilder();
            this.buildSubcommandNode(subcommandGroupBuilder, child);
            slashCommandBuilder.addSubcommandGroup(subcommandGroupBuilder);
        }
    }
}
import fluent from "fluent-iterable";
import { CommandRegistration, SlashCommandRegistration, SubcommandGroupRegistration, SubcommandRegistration } from ".";
import { RuntimeType } from "../util";
import { Command } from "./Command";

export interface CommandNode extends RuntimeType {
    type: "commandNode";
    name: string;
    description: string;
    command: Command;
}

export interface SubcommandNode extends RuntimeType {
    type: "subcommandNode";
    name: string;
    description: string;
    children: Map<string, CommandNode>;
}

export interface SubcommandGroupNode extends RuntimeType {
    type: "subcommandGroupNode";
    name: string;
    description: string;
    children: Map<string, SubcommandNode>;
}

export type SlashCommand = CommandNode | SubcommandNode | SubcommandGroupNode;

export class CommandRegistry {
    private readonly commands: Map<string, SlashCommand> = new Map();
    private locked: boolean = false;

    get slashCommands(): Iterable<[string, SlashCommand]> {
        return this.commands.entries();
    }

    get leafCommands(): Iterable<{ name: string[], description: string, command: Command }> {
        return fluent(this.commands.entries())
            .flatten(([name, slashCommand]) => CommandRegistry.iterateCommandNode([], slashCommand))
            .map(({ name, node }) => ({
                name,
                description: node.description,
                command: node.command
            }));
    }

    private static *iterateCommandNode(parentName: string[], slashCommand: SlashCommand): Generator<{ name: string[], node: CommandNode}> {
        const currentName = [...parentName, slashCommand.name];
        if (slashCommand.type === "commandNode") {
            yield {
                name: currentName,
                node: slashCommand
            };
        } else {
            const children = slashCommand.children.values();
            for (const child of children)
                yield* CommandRegistry.iterateCommandNode(currentName, child);
        }
    }

    registerSlashCommand(slashCommandRegistration: SlashCommandRegistration): CommandRegistry {
        if (this.locked)
            throw new Error("Command registry is locked!");
        
        const slashCommand = this.buildSlashCommand(slashCommandRegistration);
        this.commands.set(slashCommand.name, slashCommand);

        return this;
    }

    private buildSlashCommand(slashCommandRegistration: SlashCommandRegistration): SlashCommand {
        if (slashCommandRegistration.type === "commandRegistration")
            return this.buildCommandNode(slashCommandRegistration);
        if (slashCommandRegistration.type === "subcommandRegistration")
            return this.buildSubcommandNode(slashCommandRegistration);
        if (slashCommandRegistration.type === "subcommandGroupRegistration")
            return this.buildSubcommandGroupNode(slashCommandRegistration);

        throw Error("Unknown slash command registration type!");
    }

    private buildCommandNode(slashCommandRegistration: CommandRegistration): CommandNode {
        return {
            type: "commandNode",
            name: slashCommandRegistration.name,
            description: slashCommandRegistration.description,
            command: slashCommandRegistration.command()
        }
    }

    private buildSubcommandNode(slashCommandRegistration: SubcommandRegistration): SubcommandNode {
        return {
            type: "subcommandNode",
            name: slashCommandRegistration.name,
            description: slashCommandRegistration.description,
            children: new Map(slashCommandRegistration.children.map(child => [child.name, this.buildCommandNode(child)]))
        }
    }

    private buildSubcommandGroupNode(slashCommandRegistration: SubcommandGroupRegistration): SubcommandGroupNode {
        return {
            type: "subcommandGroupNode",
            name: slashCommandRegistration.name,
            description: slashCommandRegistration.description,
            children: new Map(slashCommandRegistration.children.map(child => [child.name, this.buildSubcommandNode(child)]))
        }
    }

    lock(): CommandRegistry {
        this.locked = true;
        return this;
    }

    count(): number {
        let count = 0;
        for (const command of this.commands.values())
            count += this.countSlashCommand(command);
        return count;
    }

    private countSlashCommand(node: SlashCommand): number {
        if (node.type === "commandNode")
            return 1;
        if (node.type === "subcommandNode")
            return this.countSubcommandNode(node);
        if (node.type === "subcommandGroupNode")
            return this.countSubcommandGroupNode(node);

        throw new Error("Unknown slash command node type!");
    }

    countSubcommandNode(node: SubcommandNode): number {
        let count = 0;
        for (const child of node.children.values())
            count += this.countSlashCommand(child);
        return count;
    }

    countSubcommandGroupNode(node: SubcommandGroupNode): number {
        let count = 0;
        for (const child of node.children.values())
            count += this.countSlashCommand(child);
        return count;
    }

    getCommand(name: string[]): Command | null {
        if (name.length === 0)
            return null;
        const head = name[0];
        const node = this.commands.get(head);
        if (!node)
            return null;
        return this.getSlashCommand(node, name.slice(1));
    }

    private getSlashCommand(node: SlashCommand, name: string[]): Command | null {
        if (node.type === "commandNode")
            return this.getCommandNode(node);
        if (node.type === "subcommandNode")
            return this.getSubcommandNode(node, name);
        if (node.type === "subcommandGroupNode")
            return this.getSubcommandGroupNode(node, name);
        return null;
    }

    private getCommandNode(node: CommandNode): Command | null {
        return node.command;
    }

    private getSubcommandNode(node: SubcommandNode, name: string[]): Command | null {
        const head = name[0];
        if (!node.children.has(head))
            return null;
        const child = node.children.get(head);
        if (!child)
            return null;
        return this.getSlashCommand(child, name.slice(1));
    }

    private getSubcommandGroupNode(node: SubcommandGroupNode, name: string[]): Command | null {
        const head = name[0];
        if (!node.children.has(head))
            return null;
        const child = node.children.get(head);
        if (!child)
            return null;
        return this.getSlashCommand(child, name.slice(1));
    }
}
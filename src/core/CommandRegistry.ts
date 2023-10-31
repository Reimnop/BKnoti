import { Func } from "../util";
import { Command } from "./Command";

export class CommandRegistry implements Iterable<[string, Command]> {
    private readonly commands: Map<string, Command> = new Map<string, Command>();
    private locked: boolean = false;

    public registerCommand(name: string, commandFactory: Func<Command>): CommandRegistry {
        if (this.locked)
            throw new Error("Command registry is locked!");
        this.commands.set(name, commandFactory());
        return this;
    }

    public lock(): CommandRegistry {
        this.locked = true;
        return this;
    }

    public count(): number {
        return this.commands.size;
    }

    public getCommand(name: string): Command | undefined {
        return this.commands.get(name);
    }

    [Symbol.iterator](): Iterator<[string, Command]> {
        return this.commands.entries();   
    }

}
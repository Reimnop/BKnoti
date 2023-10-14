import { Func } from "../util/Functional";
import { Command } from "./Command";

export class CommandRegistry implements Iterable<[string, Command]> {
    private readonly commands: Map<string, Command> = new Map<string, Command>();
    private locked: boolean = false;

    public registerCommand(name: string, commandFactory: Func<Command>): void {
        if (this.locked)
            throw new Error("Command registry is locked!");

        this.commands.set(name, commandFactory());
    }

    public getCommand(name: string): Command | undefined {
        return this.commands.get(name);
    }

    public count(): number {
        return this.commands.size;
    }

    [Symbol.iterator](): Iterator<[string, Command], any, undefined> {
        return this.commands.entries();   
    }

    public lock(): void {
        this.locked = true;
    }
}
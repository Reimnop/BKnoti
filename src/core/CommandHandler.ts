import { Client } from "discord.js";

export class CommandHandler {
    private readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }
}
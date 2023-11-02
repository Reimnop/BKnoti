import { Logger } from "pino";
import { ModalHandlerRegistry } from "./ModalHandlerRegistry";
import { Func } from "../util";
import { ModalHandler } from "./ModalHandler";
import { Client, Events } from "discord.js";

export interface ModalHandlerRegistration {
    name: string;
    modalHandler: Func<ModalHandler>;
}

export class ModalHandlerManager {
    private readonly logger: Logger;
    private readonly modalHandlerRegistry: ModalHandlerRegistry;

    constructor(logger: Logger, modalHandlerRegistrations: ModalHandlerRegistration[]) {
        this.logger = logger;
        this.modalHandlerRegistry = new ModalHandlerRegistry();
        for (const registration of modalHandlerRegistrations)
            this.modalHandlerRegistry.registerModalHandler(registration);
        this.modalHandlerRegistry.lock();
    }

    subscribeEvents(client: Client) {
        client.on(Events.ClientReady, () => {
            this.logger.info(`Registered ${this.modalHandlerRegistry.count()} modal handlers`);
        });

        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isModalSubmit())
                return;

            const modalHandlerName = interaction.customId;
            const modalHandler = this.modalHandlerRegistry.getModalHandler(modalHandlerName);
            await modalHandler?.execute(interaction);
        });
    }
}
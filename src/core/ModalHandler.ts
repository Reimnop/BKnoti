import { ModalSubmitInteraction } from "discord.js";

export interface ModalHandler {
    execute(interaction: ModalSubmitInteraction): Promise<void>;
}
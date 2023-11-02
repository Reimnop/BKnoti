import { ModalHandler } from "./ModalHandler";
import { ModalHandlerRegistration } from "./ModalHandlerManager";

export class ModalHandlerRegistry implements Iterable<[string, ModalHandler]> {
    private readonly modalHandlers: Map<string, ModalHandler> = new Map();
    private locked: boolean = false;

    registerModalHandler(modalHandlerRegistration: ModalHandlerRegistration): ModalHandlerRegistry {
        if (this.locked)
            throw new Error("Modal handler registry is locked!");

        this.modalHandlers.set(modalHandlerRegistration.name, modalHandlerRegistration.modalHandler());
        return this;
    }

    lock(): ModalHandlerRegistry {
        this.locked = true;
        return this;
    }

    count(): number {
        return this.modalHandlers.size;
    }

    getModalHandler(modalHandlerName: string): ModalHandler | null {
        return this.modalHandlers.get(modalHandlerName) ?? null;
    }

    [Symbol.iterator](): Iterator<[string, ModalHandler], any, undefined> {
        return this.modalHandlers.entries();
    }
}
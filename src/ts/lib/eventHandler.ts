import { Event } from 'dist/lib/pb/protos/events_pb';

type Handler = {
	id: string
	handle: (spaceId: string, eventMessage: Event.Message) => boolean
}

class EventHandler {
	private handlers: Map<string, Handler>;

	constructor() {
		this.handlers = new Map<string, Handler>();
	}

	handle(spaceId: string, event: Event.Message): boolean {
		for (const handler of this.handlers.values()) {
			if (handler.handle(spaceId, event)) {
				return true;
			}
		}
		return false;
	}

	register(handler: Handler) {
		this.handlers.set(handler.id, handler);
	}

	unregister(id: string) {
		delete this.handlers[id];
	}
}

export const eventHandler = new EventHandler();

import Events from 'dist/lib/pb/protos/events_pb';

type Handler = {
	id: string
	handle: (spaceId: string, eventMessage: Events.Event.Message) => boolean
}

class EventHandler {
	private handlers: Map<string, Handler>

	handle(spaceId: string, event: Events.Event.Message): boolean {
		for (const handler of this.handlers.values()) {
			if (handler.handle(spaceId, event)) {
				return true;
			}
		}
		return false;
	}

	register(handler: Handler) {
		this.handlers[handler.id] = handler;
	}

	unregister(id: string) {
		delete this.handlers[id];
	}
}

export const eventHandler = new EventHandler();

import { action, makeObservable, observable } from 'mobx';
import { ActivityGroup, ActivityItem, ChatStatusScope, LiveStatus, MessageAnchor, StatusDelta, scopeKey } from '../lib/chatStatus/model';

export class ChatStatusView {
	items = observable.map<string, ActivityItem>();
	groups = observable.map<string, ActivityGroup>();
	live: LiveStatus[] = [];
	tail: MessageAnchor | undefined = undefined;
	revision = 0;
	contentRevision = 0;

	constructor () {
		makeObservable(this, { live: observable, tail: observable, revision: observable, contentRevision: observable, apply: action });
	};

	apply (delta: StatusDelta): void {
		if (!delta.reset && (delta.revision <= this.revision)) return;
		if (delta.reset) { this.items.clear(); this.groups.clear(); };
		delta.items.forEach(item => this.items.set(item.id, item));
		delta.groups.forEach(group => this.groups.set(group.id, group));
		this.live = delta.live;
		this.tail = delta.tail;
		this.revision = delta.revision;
		if ((delta.reason == 'status') || (delta.reason == 'message')) this.contentRevision = delta.revision;
	};
}

class ChatStatusStore {
	private chats = new Map<string, ChatStatusView>();

	get (scope: ChatStatusScope): ChatStatusView {
		const key = scopeKey(scope);
		if (!this.chats.has(key)) this.chats.set(key, new ChatStatusView());
		return this.chats.get(key);
	};

	clear (accountId: string, spaceId?: string): void {
		this.chats.forEach((view, key) => {
			const [ account, space ] = JSON.parse(key);
			if ((account == accountId) && (!spaceId || (spaceId == space))) {
				view.apply({ scope: { accountId, spaceId: space, chatId: '' }, items: [], groups: [], live: [], reset: true, revision: view.revision + 1 });
				this.chats.delete(key);
			};
		});
	};
}

export const ChatStatus = new ChatStatusStore();

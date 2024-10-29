import { observable, action, computed, makeObservable, set } from 'mobx';
import { I, M, Renderer } from 'Lib';

class NotificationStore {

	public itemList: I.Notification[] = [];

	constructor () {
		makeObservable(this, {
			itemList: observable,
			list: computed,
			add: action,
			update: action,
			delete: action,
		});
	};

	get list (): I.Notification[] {
		return this.itemList || [];
	};

	set (list: I.Notification[]): void {
		this.itemList = list.map(it => new M.Notification(it));
		this.setBadge();
	};

	get (id: string): I.Notification {
		return this.itemList.find(it => it.id == id);
	};

	add (item: I.Notification): void {
		const current = this.get(item.id);

		if (current) {
			set(current, item);
		} else {
			this.itemList.unshift(item);
		};

		this.setBadge();
	};

	update (item: I.Notification): void {
		const current = this.get(item.id);

		if (current) {
			set(current, item);
		};
	};

	delete (id: string) {
		this.itemList = this.itemList.filter(it => it.id != id);
		this.setBadge();
	};

	clear () {
		this.itemList = [];
		this.setBadge();
	};

	setBadge () {
		const length = this.list.filter(it => it.status != I.NotificationStatus.Replied).length;

		Renderer.send('setBadge', String(length || ''));
	};

};

export const Notification: NotificationStore = new NotificationStore();
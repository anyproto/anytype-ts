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

	/**
	 * Gets the notification list.
	 * @private
	 * @returns {I.Notification[]} The notification list.
	 */
	get list (): I.Notification[] {
		return this.itemList || [];
	};

	/**
	 * Sets the notification list.
	 * @param {I.Notification[]} list - The notification list.
	 */
	set (list: I.Notification[]): void {
		this.itemList = list.map(it => new M.Notification(it));
	};

	/**
	 * Gets a notification by ID.
	 * @param {string} id - The notification ID.
	 * @returns {I.Notification} The notification object.
	 */
	get (id: string): I.Notification {
		return this.itemList.find(it => it.id == id);
	};

	/**
	 * Adds a notification to the list.
	 * @param {I.Notification} item - The notification to add.
	 */
	add (item: I.Notification): void {
		const current = this.get(item.id);

		if (current) {
			set(current, item);
		} else {
			this.itemList.unshift(item);
		};
	};

	/**
	 * Updates a notification in the list.
	 * @param {I.Notification} item - The notification to update.
	 */
	update (item: I.Notification): void {
		const current = this.get(item.id);

		if (current) {
			set(current, item);
		};
	};

	/**
	 * Deletes a notification by ID.
	 * @param {string} id - The notification ID.
	 */
	delete (id: string) {
		this.itemList = this.itemList.filter(it => it.id != id);
	};

	/**
	 * Clears all notifications from the list.
	 */
	clear () {
		this.itemList = [];
	};

};

export const Notification: NotificationStore = new NotificationStore();
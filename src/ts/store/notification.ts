import { observable, action, computed, makeObservable, set } from 'mobx';
import { I, M } from 'Lib';

class NotificationStore {

    public itemList: I.Notification[] = [];

    constructor () {
        makeObservable(this, {
            itemList: observable,
            list: computed,
			add: action,
			delete: action,
        });
    };

    get list (): I.Notification[] {
		return this.itemList;
	};

	set (list: I.Notification[]): void {
		this.itemList = list.map(it => new M.Notification(it));
	};

	add (item: I.Notification): void {
		this.itemList.unshift(new M.Notification(item));
	};

	update (item: I.Notification): void {
		const current = this.itemList.find(it => it.id == item.id);

		if (current) {
			set(current, item);
		};
	};

	delete (id: string) {
		this.itemList = this.itemList.filter(it => it.id != id);
	};

	clear () {
		this.itemList = [];
	};

};

 export const notificationStore: NotificationStore = new NotificationStore();

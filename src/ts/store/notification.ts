import { observable, action, computed, makeObservable } from 'mobx';
import { I } from 'Lib';

class NotificationStore {

    public itemList: I.Notification[] = [];

    timeout = 0;
	isAnimatingFlag: Map<string, boolean> = new Map();

    constructor () {
        makeObservable(this, {
            itemList: observable,
            list: computed,
        });
    };

    get list(): I.Notification[] {
		return this.itemList;
	};

	add () {
	};

	delete () {
	};

};

 export const notificationStore: NotificationStore = new NotificationStore();

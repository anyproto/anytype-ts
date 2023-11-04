import { I, UtilCommon } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Notification implements I.Notification {

	id = '';
	type: I.NotificationType = 0;

	constructor (props: I.Notification) {
		this.id = String(props.id || '');
		this.type = Number(props.type) || 0;

		makeObservable(this, {
			id: observable,
			type: observable,
		});

		intercept(this as any, change => UtilCommon.intercept(this, change));
	};

};

export default Notification;
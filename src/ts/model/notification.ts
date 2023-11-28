import { I, UtilCommon } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Notification implements I.Notification {

	id = '';
	type: I.NotificationType = 0;
	status = false;
	object = null;
	subject = null;

	constructor (props: I.Notification) {
		this.id = String(props.id || '');
		this.type = Number(props.type) || 0;
		this.status = Boolean(props.status);
		this.object = props.object;
		this.subject = props.subject;

		makeObservable(this, {
			id: observable,
			type: observable,
			status: observable,
			object: observable,
			subject: observable,
		});

		intercept(this as any, change => UtilCommon.intercept(this, change));
	};

};

export default Notification;
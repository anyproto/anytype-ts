import { I, UtilCommon } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Notification implements I.Notification {

	id = '';
	type: I.NotificationType = I.NotificationType.None;
	status: I.NotificationStatus = I.NotificationStatus.Created;
	createTime = 0;
	isLocal = false;
	payload = {};

	constructor (props: I.Notification) {
		this.id = String(props.id || '');
		this.type = props.type || I.NotificationType.None;
		this.status = Number(props.status) || I.NotificationStatus.Created;
		this.createTime = Number(props.createTime) || 0;
		this.isLocal = Boolean(props.isLocal);
		this.payload = props.payload || {};

		makeObservable(this, {
			status: observable,
		});

		intercept(this as any, change => UtilCommon.intercept(this, change));
	};

};

export default Notification;
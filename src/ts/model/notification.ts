import { I, U, J, translate } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class Notification implements I.Notification {

	id = '';
	type: I.NotificationType = I.NotificationType.None;
	status: I.NotificationStatus = I.NotificationStatus.Created;
	createTime = 0;
	isLocal = false;
	payload: any = {};
	title = '';
	text = '';

	constructor (props: I.Notification) {
		this.id = String(props.id || '');
		this.type = props.type || I.NotificationType.None;
		this.status = Number(props.status) || I.NotificationStatus.Created;
		this.createTime = Number(props.createTime) || 0;
		this.isLocal = Boolean(props.isLocal);
		this.payload = props.payload || {};

		this.fillContent();

		makeObservable(this, {
			status: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

	fillContent () {
		const { importType, errorCode, name } = this.payload;
		const lang = errorCode ? 'error' : 'success';
		const et = U.Common.enumKey(I.NotificationType, this.type);
		const identityName = U.Common.shorten(String(this.payload.identityName || translate('defaultNamePage')), 32);
		const spaceName = U.Common.shorten(String(this.payload.spaceName || translate('defaultNamePage')), 32);
		const permissions = translate(`participantPermissions${this.payload.permissions}`);

		this.title = translate(U.Common.toCamelCase(`notification-${et}-${lang}-title`));
		this.text = translate(U.Common.toCamelCase(`notification-${et}-${lang}-text`));

		switch (this.type) {
			case I.NotificationType.Import: {
				if (Object.values(J.Error.Code.Import).includes(errorCode)) {
					this.title = translate('commonError');
					this.text = translate(`notificationImportErrorText${errorCode}`);
				};
				break;
			};

			case I.NotificationType.Gallery: {
				if (errorCode) {
					this.text = U.Common.sprintf(this.text, name);
				} else {
					this.title = U.Common.sprintf(this.title, name);
					this.text = U.Common.sprintf(this.text, spaceName);
				};
				break;
			};

			case I.NotificationType.Join: 
			case I.NotificationType.Leave: {
				this.title = '';
				this.text = U.Common.sprintf(this.text, identityName, spaceName);
				break;
			};

			case I.NotificationType.Approve: {
				this.title = '';
				this.text = U.Common.sprintf(this.text, spaceName, permissions);
				break;
			};

			case I.NotificationType.Decline:
			case I.NotificationType.Remove: {
				this.title = '';
				this.text = U.Common.sprintf(this.text, spaceName);
				break;
			};

			case I.NotificationType.Permission: {
				this.title = '';
				this.text = U.Common.sprintf(this.text, permissions, spaceName);
				break;
			};

		};
	};

};

export default Notification;

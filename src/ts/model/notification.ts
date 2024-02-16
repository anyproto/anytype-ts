import { I, UtilCommon, UtilObject, translate } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';
import Errors from 'json/error.json';

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

		intercept(this as any, change => UtilCommon.intercept(this, change));
	};

	fillContent () {
		const { importType, errorCode, name, spaceId, identityName } = this.payload;
		const space = UtilObject.getSpaceviewBySpaceId(spaceId);
		const lang = errorCode ? 'error' : 'success';
		const et = UtilCommon.enumKey(I.NotificationType, this.type);

		if (!space) {
			return;
		};

		this.title = translate(UtilCommon.toCamelCase(`notification-${et}-${lang}-title`));
		this.text = translate(UtilCommon.toCamelCase(`notification-${et}-${lang}-text`));

		switch (this.type) {
			case I.NotificationType.Import: {
				if ((importType == I.ImportType.Notion) && (errorCode == Errors.Code.NO_OBJECTS_TO_IMPORT)) {
					this.title = translate('notificationNotionErrorNoObjectsTitle');
					this.text = translate('notificationNotionErrorNoObjectsText');
				};
				break;
			};

			case I.NotificationType.Gallery: {
				if (errorCode) {
					this.text = UtilCommon.sprintf(this.text, name);
				} else {
					this.title = UtilCommon.sprintf(this.title, name);
					this.text = UtilCommon.sprintf(this.text, space.name);
				};
				break;
			};

			case I.NotificationType.Join: {
				this.title = '';
				this.text = UtilCommon.sprintf(this.text, identityName, space.name);
				break;
			};

		};
	};

};

export default Notification;
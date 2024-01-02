import { I, UtilCommon, translate } from 'Lib';
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
		const { importType, errorCode } = this.payload;
		const lang = errorCode ? 'error' : 'success';

		this.title = translate(UtilCommon.toCamelCase(`notification-${this.type}-${lang}-title`));
		this.text = translate(UtilCommon.toCamelCase(`notification-${this.type}-${lang}-text`));

		if ((this.type == I.NotificationType.Import)) {
			if ((importType == I.ImportType.Notion) && (errorCode == Errors.Code.NO_OBJECTS_TO_IMPORT)) {
				this.title = translate('notificationNotionErrorNoObjectsTitle');
				this.text = translate('notificationNotionErrorNoObjectsText');
			};
		};
	};

};

export default Notification;
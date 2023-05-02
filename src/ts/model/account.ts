import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class AccountInfo implements I.AccountInfo {
	
	homeObjectId = '';
	profileObjectId = '';
	gatewayUrl = '';
	deviceId = '';
	localStoragePath = '';
	accountSpaceId = '';
	widgetsId = '';
	
	constructor (props: I.AccountInfo) {
		this.homeObjectId = String(props.homeObjectId || '');
		this.profileObjectId = String(props.profileObjectId || '');
		this.gatewayUrl = String(props.gatewayUrl || '');
		this.deviceId = String(props.deviceId || '');
		this.localStoragePath = String(props.localStoragePath || '');
		this.accountSpaceId = String(props.accountSpaceId || '');
		this.widgetsId = String(props.widgetsId || '');

		makeObservable(this, {
			homeObjectId: observable,
			profileObjectId: observable,
			gatewayUrl: observable,
			deviceId: observable,
			localStoragePath: observable,
			accountSpaceId: observable,
			widgetsId: observable,
		});

		intercept(this as any, change => Util.intercept(this, change));
		return this;
	};

};

class AccountConfig implements I.AccountConfig {
	
	constructor (props: I.AccountConfig) {
		return this;
	};

};

class AccountStatus implements I.AccountStatus {
	
	type: I.AccountStatusType = I.AccountStatusType.Active;
	date = 0;
	
	constructor (props: I.AccountStatus) {
		this.type = Number(props.type) || I.AccountStatusType.Active;
		this.date = Number(props.date) || 0;

		makeObservable(this, {
			type: observable,
			date: observable,
		});

		intercept(this as any, change => Util.intercept(this, change));
		return this;
	};

};

class Account implements I.Account {
	
	id = '';
	info: I.AccountInfo = null;
	config: I.AccountConfig = null;
	status: I.AccountStatus = null;
	
	constructor (props: I.Account) {
		this.id = String(props.id || '');
		this.info = new AccountInfo(props.info);
		this.config = new AccountConfig(props.config);
		this.status = new AccountStatus(props.status);

		makeObservable(this, {
			id: observable,
			status: observable,
		});

		intercept(this as any, change => Util.intercept(this, change));
		return this;
	};

};

export default Account;
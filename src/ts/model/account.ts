import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class AccountInfo implements I.AccountInfo {
	
	homeObjectId = '';
	profileObjectId = '';
	gatewayUrl = '';
	marketplaceTypeObjectId = '';
	marketplaceTemplateObjectId = '';
	marketplaceRelationObjectId = '';
	deviceId = '';
	localStoragePath = '';
	accountSpaceId = '';
	
	constructor (props: I.AccountInfo) {
		this.homeObjectId = String(props.homeObjectId || '');
		this.profileObjectId = String(props.profileObjectId || '');
		this.gatewayUrl = String(props.gatewayUrl || '');
		this.marketplaceTypeObjectId = String(props.marketplaceTypeObjectId || '');
		this.marketplaceTemplateObjectId = String(props.marketplaceTemplateObjectId || '');
		this.marketplaceRelationObjectId = String(props.marketplaceRelationObjectId || '');
		this.deviceId = String(props.deviceId || '');
		this.localStoragePath = String(props.localStoragePath || '');
		this.accountSpaceId = String(props.accountSpaceId || '');

		makeObservable(this, {
			homeObjectId: observable,
			profileObjectId: observable,
			gatewayUrl: observable,
			marketplaceTypeObjectId: observable,
			marketplaceRelationObjectId: observable,
			marketplaceTemplateObjectId: observable,
			deviceId: observable,
			localStoragePath: observable,
			accountSpaceId: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
		return this;
	};

};

class AccountConfig implements I.AccountConfig {
	
	allowSpaces = false;
	allowBeta = false;
	
	constructor (props: I.AccountConfig) {
		this.allowSpaces = Boolean(props.allowSpaces);
		this.allowBeta = Boolean(props.allowBeta);

		makeObservable(this, {
			allowSpaces: observable,
			allowBeta: observable,
		});

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
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

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
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

		intercept(this as any, (change: any) => { return Util.intercept(this, change); });
		return this;
	};

};

export default Account;
import { observable, action } from 'mobx';

class AuthStore {
	@observable public code: string = '';
	@observable public pin: string = '';
	
	constructor () {
	};
	
	@action
	setCode (v: string) {
		this.code = v;
	};
	
	@action
	setPin (v: string) {
		this.pin = v;
	};
	
};

export let authStore: AuthStore = new AuthStore();
import { observable, action } from 'mobx';

class AuthStore {
	@observable public pin: string = '';
	
	constructor () {
	};
	
	@action
	setPin (v: string) {
		this.pin = v;
	};
	
};

export let authStore: AuthStore = new AuthStore();
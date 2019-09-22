import { observable, action } from 'mobx';

class AuthStore {
	@observable public pin: string = '';
	
	@action
	setPin (v: string) {
		this.pin = v;
	};
	
};

export let authStore: AuthStore = new AuthStore();
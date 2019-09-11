import { observable, action } from 'mobx';

class AuthStore {
	@observable public code: string;
	
	constructor () {
	};
	
	@action
	setCode (code: string) {
		this.code = code;
	};
	
};

export default AuthStore;
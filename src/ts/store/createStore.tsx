import { AuthStore } from './';

export default function createStore () {
	return {
		auth: new AuthStore(),
	};
};
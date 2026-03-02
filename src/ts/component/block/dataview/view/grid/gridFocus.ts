import { observable, action, computed, makeObservable } from 'mobx';

class GridFocus {

	public relationKey = '';
	public recordId = '';

	constructor () {
		makeObservable(this, {
			relationKey: observable,
			recordId: observable,
			isActive: computed,
			set: action,
			clear: action,
		});
	};

	get isActive (): boolean {
		return !!(this.relationKey && this.recordId);
	};

	set (relationKey: string, recordId: string) {
		this.relationKey = relationKey;
		this.recordId = recordId;
	};

	clear () {
		this.relationKey = '';
		this.recordId = '';
	};

	matches (relationKey: string, recordId: string): boolean {
		return (this.relationKey === relationKey) && (this.recordId === recordId);
	};

};

export const gridFocus = new GridFocus();

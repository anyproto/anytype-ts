import { I } from 'Lib';
import { observable, makeObservable } from 'mobx';

class BlockContentRelation implements I.ContentRelation {
	
	key = '';
	
	constructor (props: I.ContentRelation) {
		this.key = String(props.key || '');

		makeObservable(this, {
			key: observable,
		});

		return this;
	};

};

export default BlockContentRelation;
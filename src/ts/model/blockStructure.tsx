import { I, Util } from 'ts/lib';
import { decorate, observable, intercept } from 'mobx';

class BlockStructure implements I.BlockStructure {
	
	parentId: string = '';
	childrenIds: string[] = [];
	
	constructor (props: I.BlockStructure) {
		let self = this;
		
		self.parentId = String(props.parentId || '');
		self.childrenIds = props.childrenIds || [];

		decorate(self, {
			parentId: observable,
			childrenIds: observable,
		});

		intercept(self as any, (change: any) => { 
			return Util.intercept(self, change); 
		});
	};

};

export default BlockStructure;
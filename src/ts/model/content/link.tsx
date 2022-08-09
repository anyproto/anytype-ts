import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentLink implements I.ContentLink {
	
	targetBlockId: string = '';
	iconSize: I.LinkIconSize = I.LinkIconSize.None;
	cardStyle: I.LinkCardStyle = I.LinkCardStyle.Text;
	description: I.LinkDescription = I.LinkDescription.None;
	relations: string[] = [];
	
	constructor (props: I.ContentLink) {
		let self = this;
		
		self.targetBlockId = String(props.targetBlockId || '');
		self.iconSize = Number(props.iconSize) || I.LinkIconSize.None;
		self.cardStyle = Number(props.cardStyle) || I.LinkCardStyle.Text;
		self.description = Number(props.description) || I.LinkDescription.None;
		self.relations = props.relations || [];

		makeObservable(self, {
			targetBlockId: observable,
			iconSize: observable,
			cardStyle: observable,
			description: observable,
			relations: observable,
		});

		intercept(self as any, (change: any) => { return Util.intercept(self, change); });
	};

};

export default BlockContentLink;
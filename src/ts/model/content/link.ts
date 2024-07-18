import { I, U } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentLink implements I.ContentLink {
	
	targetBlockId = '';
	iconSize: I.LinkIconSize = I.LinkIconSize.None;
	cardStyle: I.LinkCardStyle = I.LinkCardStyle.Text;
	description: I.LinkDescription = I.LinkDescription.None;
	relations: string[] = [];
	
	constructor (props: I.ContentLink) {
		this.targetBlockId = String(props.targetBlockId || '');
		this.iconSize = Number(props.iconSize) || I.LinkIconSize.None;
		this.cardStyle = Number(props.cardStyle) || I.LinkCardStyle.Text;
		this.description = Number(props.description) || I.LinkDescription.None;
		this.relations = Array.isArray(props.relations) ? props.relations : [];

		makeObservable(this, {
			targetBlockId: observable,
			iconSize: observable,
			cardStyle: observable,
			description: observable,
			relations: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default BlockContentLink;
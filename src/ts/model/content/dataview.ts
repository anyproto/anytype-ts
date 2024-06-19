import { observable, intercept, makeObservable } from 'mobx';
import { I, U } from 'Lib';
import View from '../view';

class BlockContentDataview implements I.ContentDataview {
	
	sources: string[] = [];
	views: I.View[] = [];
	relationLinks: any[] = [];
	groupOrder: any[] = [];
	objectOrder: any[] = [];
	viewId = '';
	targetObjectId = '';
	isCollection = false;
	
	constructor (props: I.ContentDataview) {
		this.targetObjectId = String(props.targetObjectId || '');
		this.viewId = String(props.viewId || '');
		this.isCollection = Boolean(props.isCollection);

		this.sources = Array.isArray(props.sources) ? props.sources : [];
		this.views = Array.isArray(props.views) ? props.views : [];
		this.relationLinks = Array.isArray(props.relationLinks) ? props.relationLinks : [];
		this.groupOrder = Array.isArray(props.groupOrder) ? props.groupOrder : [];
		this.objectOrder = Array.isArray(props.objectOrder) ? props.objectOrder : [];

		this.views = this.views.map(it => new View(it));
		
		makeObservable(this, {
			sources: observable,
			viewId: observable,
			views: observable,
			groupOrder: observable,
			objectOrder: observable,
			relationLinks: observable,
			targetObjectId: observable,
			isCollection: observable,
		});

		intercept(this as any, change => U.Common.intercept(this, change));
	};

};

export default BlockContentDataview;
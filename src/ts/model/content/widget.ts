import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentWidget implements I.ContentWidget {
	
	layout: I.WidgetLayout = I.WidgetLayout.Link;
	limit = 0;
	viewId = '';

	constructor (props: I.ContentWidget) {
		this.layout = Number(props.layout) || I.WidgetLayout.Link;
		this.limit = Number(props.limit) || 0;
		this.viewId = String(props.viewId || '');

		makeObservable(this, {
			layout: observable,
			limit: observable,
			viewId: observable,
		});

		intercept(this as any, change => Util.intercept(this, change));
	};

};

export default BlockContentWidget;
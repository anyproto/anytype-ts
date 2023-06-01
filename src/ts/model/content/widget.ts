import { I, Util } from 'Lib';
import { observable, intercept, makeObservable } from 'mobx';

class BlockContentWidget implements I.ContentWidget {
	
	layout: I.WidgetLayout = I.WidgetLayout.Link;
	limit = 0;

	constructor (props: I.ContentWidget) {
		this.layout = Number(props.layout) || I.WidgetLayout.Link;
		this.limit = Number(props.limit) || 0;

		makeObservable(this, {
			layout: observable,
			limit: observable,
		});

		intercept(this as any, change => Util.intercept(this, change));
	};

};

export default BlockContentWidget;
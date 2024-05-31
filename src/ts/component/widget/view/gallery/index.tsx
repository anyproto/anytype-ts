import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';

const WidgetViewGallery = observer(class WidgetViewGallery extends React.Component<I.WidgetListComponent> {

	node = null;

	constructor (props: I.WidgetListComponent) {
		super(props);
	};

	render (): React.ReactNode {
		return (
			<div ref={ref => this.node = ref} className="body">
			</div>
		);
	};

});

export default WidgetViewGallery;
import * as React from 'react';
import { observer } from 'mobx-react';
import { I } from 'Lib';
import { detailStore } from 'Store';
import Item from './item';

const Constant = require('json/constant.json');

const WidgetViewGallery = observer(class WidgetViewGallery extends React.Component<I.WidgetViewComponent> {

	node = null;

	constructor (props: I.WidgetViewComponent) {
		super(props);
	};

	render (): React.ReactNode {
		const { block, subId, getView } = this.props;
		const view = getView();
		const items = this.getItems();

		console.log(items);

		return (
			<div ref={ref => this.node = ref} className="body">
				<div className="items">
					{items.map(item => (
						<Item 
							{...this.props}
							key={`widget-${block.id}-item-${item.id}`} 
							subId={subId}
							id={item.id} 
							hideIcon={view.hideIcon}
						/>
					))}
				</div>
			</div>
		);
	};

	getItems () {
		const { getRecordIds, subId } = this.props;

		return getRecordIds().map(id => detailStore.get(subId, id, Constant.sidebarRelationKeys));
	};

});

export default WidgetViewGallery;
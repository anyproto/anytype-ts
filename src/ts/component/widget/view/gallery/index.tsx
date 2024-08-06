import * as React from 'react';
import { observer } from 'mobx-react';
import { I, S, U, J } from 'Lib';
import Item from './item';

const WidgetViewGallery = observer(class WidgetViewGallery extends React.Component<I.WidgetViewComponent> {

	node = null;

	render (): React.ReactNode {
		const { block, subId, getView } = this.props;
		const view = getView();
		const items = this.getItems();

		return (
			<div ref={ref => this.node = ref} className="body">
				<div id="items" className="items">
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
		return getRecordIds().map(id => S.Detail.get(subId, id, J.Relation.sidebar));
	};

});

export default WidgetViewGallery;
import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { I, S, J } from 'Lib';
import Item from './item';

const WidgetViewGallery = observer(forwardRef<{}, I.WidgetViewComponent>((props, ref) => {
	
	const { block, subId, getView, getRecordIds } = props;
	const view = getView();
	const items = getRecordIds().map(id => S.Detail.get(subId, id, J.Relation.sidebar));

	return (
		<div className="body">
			<div id="items" className="items">
				{items.map(item => (
					<Item 
						{...props}
						key={`widget-${block.id}-item-${item.id}`} 
						subId={subId}
						id={item.id} 
						hideIcon={view.hideIcon}
					/>
				))}
			</div>
		</div>
	);

}));

export default WidgetViewGallery;
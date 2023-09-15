import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I } from 'Lib';
import { dbStore, detailStore } from 'Store';

interface Props extends I.ViewComponent {
	d: number;
	m: number;
	y: number;
	getSubId?: () => string;
};

const Item = observer(class Item extends React.Component<Props> {

	node: any = null;

	render () {
		const { rootId, block, className, getSubId, getView, getLimit, d } = this.props;
		const view = getView();
		const subId = getSubId();
		const items = this.getItems();
		const { total } = dbStore.getMeta(subId, '');

		return (
			<div 
				ref={node => this.node = node} 
				className={className}
			>
				<div className="number">{d}</div>
				<div className="items">
					{items.map((item, i) => (
						<div key={i} className="item">
							<IconObject object={item} />
							<ObjectName object={item} />
						</div>
					))}
				</div>
			</div>
		);
	};

	getItems () {
		const { getSubId, getView } = this.props;
		const subId = getSubId();
		const view = getView();

		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, [ view.groupRelationKey ]));
	};

});

export default Item;
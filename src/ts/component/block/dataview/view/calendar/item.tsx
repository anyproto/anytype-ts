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
	getDateParam?: (t: number) => { d: number; m: number; y: number; };
};

const Item = observer(class Item extends React.Component<Props> {

	node: any = null;

	render () {
		const { className, getSubId, getView, d } = this.props;
		const subId = getSubId();
		const items = this.getItems();

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
		const { getSubId, getView, getDateParam, d, m, y } = this.props;
		const subId = getSubId();
		const view = getView();

		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, [ view.groupRelationKey ])).filter(it => {
			const value = getDateParam(it[view.groupRelationKey]);
			return [ value.d, value.m, value.y ].join('-') == [ d, m, y ].join('-');
		});
	};

});

export default Item;
import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilCommon, translate } from 'Lib';
import { dbStore, detailStore } from 'Store';

interface Props extends I.ViewComponent {
	d: number;
	m: number;
	y: number;
	getSubId?: () => string;
	getDateParam?: (t: number) => { d: number; m: number; y: number; };
};

const LIMIT = 4;

const Item = observer(class Item extends React.Component<Props> {

	node: any = null;

	render () {
		const { className, d, getView } = this.props;
		const view = getView();
		const items = this.getItems()
		const slice = items.slice(0, LIMIT);
		const length = items.length;

		let more = null;
		if (length > LIMIT) {
			more = (
				<div className="item more">
					+{length - LIMIT} {translate('commonMore')} {UtilCommon.plural(length, translate('pluralObject')).toLowerCase()}
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				className={className}
			>
				<div className="number">{d}</div>
				<div className="items">
					{slice.map((item, i) => (
						<div key={i} className="item">
							{!view.hideIcon ? <IconObject object={item} size={16} /> : ''}
							<ObjectName object={item} />
						</div>
					))}

					{more}
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
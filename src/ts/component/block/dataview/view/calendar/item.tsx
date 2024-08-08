import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, S, U, translate } from 'Lib';

interface Props extends I.ViewComponent {
	d: number;
	m: number;
	y: number;
	items: any[];
};

const LIMIT = 4;

const Item = observer(class Item extends React.Component<Props> {

	node = null;

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onMore = this.onMore.bind(this);
	};

	render () {
		const { className, d, m, y, getView, onContext } = this.props;
		const view = getView();
		const { hideIcon } = view;
		const items = this.getItems();
		const slice = items.slice(0, LIMIT);
		const length = items.length;
		const cn = [ 'day' ];

		if (className) {
			cn.push(className);
		};

		let more = null;
		if (length > LIMIT) {
			more = (
				<div className="item more" onClick={this.onMore}>
					+{length - LIMIT} {translate('commonMore')} {U.Common.plural(length, translate('pluralObject')).toLowerCase()}
				</div>
			);
		};

		const Item = (item: any) => {
			const canEdit = !item.isReadonly && S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);

			let icon = null;
			if (!hideIcon) {
				icon = <IconObject object={item} size={16} canEdit={canEdit} />;
			};

			return (
				<div className="item" onContextMenu={e => onContext(e, item.id)}>
					{icon}
					<ObjectName object={item} onClick={() => this.onOpen(item)} />
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				className={cn.join(' ')}
			>
				<div className="number">
					<div className="inner">{d}</div>
				</div>
				<div className="items">
					{slice.map((item, i) => (
						<Item key={[ y, m, d, item.id ].join('-')} {...item} />
					))}

					{more}
				</div>
			</div>
		);
	};

	getItems () {
		const { getView, d, m, y, items } = this.props;
		const view = getView();
		const current = [ d, m, y ].join('-');

		return items.filter(it => U.Date.date('j-n-Y', it[view.groupRelationKey]) == current);
	};

	onOpen (record: any) {
		U.Object.openConfig(record);
	};

	onMore () {
		const { block, getView, readonly } = this.props;
		const node = $(this.node);
		const view = getView();

		S.Menu.closeAll([ 'dataviewCalendarDay' ], () => {
			S.Menu.open('dataviewCalendarDay', {
				element: node,
				horizontal: I.MenuDirection.Center,
				width: node.outerWidth() + 8,
				offsetY: -(node.outerHeight() + 4),
				className: 'fromBlock',
				noFlipX: true,
				data: {
					...this.props,
					blockId: block.id,
					relationKey: view.groupRelationKey,
					hideIcon: view.hideIcon,
					readonly,
				}
			});
		});
	};

});

export default Item;
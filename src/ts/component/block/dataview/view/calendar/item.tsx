import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, S, U, translate, analytics, C, J } from 'Lib';

interface Props extends I.ViewComponent {
	d: number;
	m: number;
	y: number;
	items: any[];
	onObjectAdd: (date: any) => void;
};

const LIMIT = 4;

const Item = observer(class Item extends React.Component<Props> {

	node = null;

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onContext = this.onContext.bind(this);
	};

	render () {
		const { items, className, d, m, y, getView, onContext } = this.props;
		const view = getView();
		const { hideIcon } = view;
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
				id={`day-${d}${m}${y}`}
				className={cn.join(' ')}
				onContextMenu={this.onContext}
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

	onContext () {
		const { d, m, y, getView, onObjectAdd } = this.props;
		const element = `#day-${d}${m}${y}`;
		const view = getView();
		const groupRelation = S.Record.getRelationByKey(view.groupRelationKey);
		const options = [];

		if (!groupRelation.isReadonlyValue) {
			options.push({ id: 'add', name: translate('commonNewObject') });
		};

		if (!options.length) {
			return;
		};

		S.Menu.open('select', {
			element,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			offsetY: -this.node.clientHeight + 32,
			offsetX: 16,
			noFlipX: true,
			noFlipY: true,
			data: {
				options,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					if (item.id == 'add') {
						onObjectAdd({d, m, y});
					}
				},
			}
		});
	};

});

export default Item;

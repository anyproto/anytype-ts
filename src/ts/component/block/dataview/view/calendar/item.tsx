import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, S, U, translate, Preview } from 'Lib';

interface Props extends I.ViewComponent {
	d: number;
	m: number;
	y: number;
	items: any[];
	onCreate: (details: any) => void;
};

const LIMIT = 4;

const Item = observer(class Item extends React.Component<Props> {

	node = null;

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onContext = this.onContext.bind(this);
		this.canCreate = this.canCreate.bind(this);
		this.onDoubleClick = this.onDoubleClick.bind(this);
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
				<div 
					id={`item-${item.id}`}
					className="item" 
					onContextMenu={e => onContext(e, item.id)}
					onMouseEnter={e => this.onMouseEnter(e, item)}
					onMouseLeave={this.onMouseLeave}
				>
					{icon}
					<ObjectName object={item} onClick={() => this.onOpen(item)} />
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				className={cn.join(' ')}
				onContextMenu={this.onContext}
				onDoubleClick={this.onDoubleClick}
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

	onMouseEnter (e: any, item: any) {
		const node = $(this.node);
		const element = node.find(`#item-${item.id}`);

		Preview.tooltipShow({ text: item.name, element });
	};

	onMouseLeave (e: any) {
		Preview.tooltipHide(false);
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
		const node = $(this.node);
		const options = [];

		if (this.canCreate()) {
			options.push({ id: 'add', name: translate('commonNewObject') });
		};

		if (!options.length) {
			return;
		};

		S.Menu.open('select', {
			element: node,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			offsetY: -node.outerHeight() + 32,
			offsetX: 16,
			noFlipX: true,
			noFlipY: true,
			data: {
				options,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					if (item.id == 'add') {
						this.onCreate();
					}
				},
			}
		});
	};

	onDoubleClick () {
		if (!this.canCreate()) {
			return;
		};
		this.onCreate();
	};

	onCreate () {
		const { d, m, y, getView, onCreate } = this.props;
		const view = getView();
		const details = {};

		details[view.groupRelationKey] = U.Date.timestamp(y, m, d, 12, 0, 0);
		onCreate(details);
	};

	canCreate () {
		const { getView, isAllowedObject } = this.props;
		const view = getView();
		const groupRelation = S.Record.getRelationByKey(view.groupRelationKey);

		return !groupRelation.isReadonlyValue && isAllowedObject();
	};

});

export default Item;

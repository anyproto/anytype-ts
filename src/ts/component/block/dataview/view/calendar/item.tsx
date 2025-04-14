import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName, Icon } from 'Component';
import { I, S, U, translate, Preview } from 'Lib';

interface Props extends I.ViewComponent {
	d: number;
	m: number;
	y: number;
	items: any[];
	isToday: boolean;
	onCreate: (details: any) => void;
};

const LIMIT = 4;

const Item = observer(class Item extends React.Component<Props> {

	node = null;

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onOpenDate = this.onOpenDate.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onContext = this.onContext.bind(this);
		this.canCreate = this.canCreate.bind(this);
		this.onCreate = this.onCreate.bind(this);
	};

	render () {
		const { items, className, d, m, y, getView, onContext } = this.props;
		const view = getView();
		const { hideIcon } = view;
		const slice = items.slice(0, LIMIT);
		const length = items.length;
		const cn = [ 'day' ];
		const canCreate = this.canCreate();

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
			const canEdit = !item.isReadonly && S.Block.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]) && U.Object.isTaskLayout(item.layout);
			const icon = hideIcon ? null : <IconObject id={`item-${item.id}-icon`} object={item} size={16} canEdit={canEdit} />;

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
				onDoubleClick={this.onCreate}
			>
				<div className="head">
					{canCreate ? (
						<Icon 
							className="plus withBackground" 
							tooltipParam={{ text: translate(`commonNewObject`) }} 
							onClick={this.onCreate} 
						/> 
					) : ''}

					<div className="number" onClick={this.onOpenDate}>
						<div className="inner">{d}</div>
					</div>
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
		const name = U.Common.shorten(item.name, 50);

		Preview.tooltipShow({ text: name, element });
	};

	onMouseLeave (e: any) {
		Preview.tooltipHide(false);
	};

	onMore () {
		const { block, getView, readonly } = this.props;
		const node = $(this.node);
		const view = getView();

		S.Menu.closeAll([ 'calendarDay' ], () => {
			S.Menu.open('calendarDay', {
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
					onCreate: this.onCreate,
				}
			});
		});
	};

	onContext (e: any) {
		const node = $(this.node);
		const options = [
			{ id: 'open', icon: 'expand', name: translate('commonOpenObject') }
		] as I.Option[];

		if (this.canCreate()) {
			options.push({ id: 'add', name: translate('commonNewObject') });
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
					switch (item.id) {
						case 'open': this.onOpenDate(); break;
						case 'add': this.onCreate(e); break;
					};
				},
			}
		});
	};

	onCreate (e: any) {
		if (!this.canCreate()) {
			return;
		};

		e?.stopPropagation();

		const { d, m, y, getView, onCreate } = this.props;
		const view = getView();
		const details = {};

		details[view.groupRelationKey] = U.Date.timestamp(y, m, d, 12, 0, 0);
		onCreate(details);
	};

	onOpenDate () {
		const { d, m, y, getView } = this.props;
		const view = getView();

		U.Object.openDateByTimestamp(view.groupRelationKey, U.Date.timestamp(y, m, d, 12, 0, 0), 'config');
	};

	canCreate (): boolean {
		const { isToday, getView, isAllowedObject } = this.props;
		const view = getView();

		if (!view) {
			return false;
		};

		const groupRelation = S.Record.getRelationByKey(view.groupRelationKey);
		return groupRelation && (!groupRelation.isReadonlyValue || isToday) && isAllowedObject();
	};

});

export default Item;

import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilCommon, UtilObject, translate } from 'Lib';
import { dbStore, detailStore, menuStore, blockStore } from 'Store';

interface Props extends I.ViewComponent {
	d: number;
	m: number;
	y: number;
	getSubId?: () => string;
	getDateParam?: (t: number) => { d: number; m: number; y: number; };
};

const LIMIT = 4;

const Item = observer(class Item extends React.Component<Props> {

	node = null;

	constructor (props: Props) {
		super(props);

		this.onOpen = this.onOpen.bind(this);
		this.onMore = this.onMore.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
	};

	render () {
		const { className, d, m, y, getView } = this.props;
		const view = getView();
		const { hideIcon } = view;
		const items = this.getItems();
		const slice = items.slice(0, LIMIT);
		const length = items.length;
		const cn = [ 'day' ];

		console.log(items, slice);

		if (className) {
			cn.push(className);
		};

		let more = null;
		if (length > LIMIT) {
			more = (
				<div className="item more" onClick={this.onMore}>
					+{length - LIMIT} {translate('commonMore')} {UtilCommon.plural(length, translate('pluralObject')).toLowerCase()}
				</div>
			);
		};

		const Item = (item: any) => {
			const canEdit = !item.isReadonly && blockStore.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);

			let icon = null;
			if (!hideIcon) {
				icon = (
					<IconObject 
						object={item} 
						size={16} 
						canEdit={canEdit} 
						onSelect={icon => this.onSelect(item, icon)} 
						onUpload={hash => this.onUpload(item, hash)} 
						onCheckbox={() => this.onCheckbox(item)} 
					/>
				);
			};

			return (
				<div className="item">
					{icon}
					<ObjectName object={item} onMouseDown={() => this.onOpen(item)} />
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				className={cn.join(' ')}
			>
				<div className="number">{d}</div>
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
		const { getSubId, getView, getDateParam, d, m, y } = this.props;
		const subId = getSubId();
		const view = getView();

		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, [ view.groupRelationKey ])).filter(it => {
			const value = getDateParam(it[view.groupRelationKey]);
			return [ value.d, value.m, value.y ].join('-') == [ d, m, y ].join('-');
		});
	};

	onOpen (item: any) {
		UtilObject.openPopup(item);
	};

	onSelect (item: any, icon: string) {
		UtilObject.setIcon(item.id, icon, '');
	};

	onUpload (item: any, hash: string) {
		UtilObject.setIcon(item.id, '', hash);
	};

	onCheckbox (item: any) {
		UtilObject.setDone(item.id, !item.done);
	};

	onMore () {
		const node = $(this.node);

		menuStore.closeAll([ 'dataviewCalendarDay' ], () => {
			menuStore.open('dataviewCalendarDay', {
				element: node,
				horizontal: I.MenuDirection.Center,
				width: node.outerWidth() + 8,
				offsetY: -(node.outerHeight() + 4),
				noFlipX: true,
				data: {
					...this.props,
					items: this.getItems(),
				}
			});
		});
	};

});

export default Item;
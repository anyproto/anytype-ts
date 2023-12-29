import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilCommon, UtilObject, translate, UtilDate } from 'Lib';
import { menuStore, blockStore } from 'Store';

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
						onUpload={objectId => this.onUpload(item, objectId)} 
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

		return items.filter(it => UtilDate.date('j-n-Y', it[view.groupRelationKey]) == current);
	};

	onOpen (item: any) {
		UtilObject.openPopup(item);
	};

	onSelect (item: any, icon: string) {
		UtilObject.setIcon(item.id, icon, '');
	};

	onUpload (item: any, objectId: string) {
		UtilObject.setIcon(item.id, '', objectId);
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
				}
			});
		});
	};

});

export default Item;
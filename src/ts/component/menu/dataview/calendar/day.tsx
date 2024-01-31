import * as React from 'react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilObject, keyboard, UtilDate } from 'Lib';
import { blockStore, dbStore, detailStore } from 'Store';
import { observer } from 'mobx-react';

const MenuCalendarDay = observer(class MenuCalendarDay extends React.Component<I.Menu> {
	
	n = 0;

	constructor (props: I.Menu) {
		super(props);

		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onCheckbox = this.onCheckbox.bind(this);
	};

	render () {
		const { param, getId } = this.props;
		const { data } = param;
		const { d, getView, className } = data;
		const items = this.getItems();
		const view = getView();
		const { hideIcon } = view;
		const cn = [ 'day' ];
		const menuId = getId();

		if (className) {
			cn.push(className);
		};

		const Item = (item) => {
			const canEdit = !item.isReadonly && blockStore.isAllowed(item.restrictions, [ I.RestrictionObject.Details ]);
			return (
				<div 
					id={`item-${item.id}`}
					className="item" 
					onMouseEnter={e => this.onMouseEnter(e, item)}
				>
					{!hideIcon ? (
						<IconObject 
							id={[ menuId, item.id, 'icon' ].join('-')}
							object={item} 
							size={16} 
							canEdit={canEdit}
							onSelect={icon => this.onSelect(item, icon)} 
							onUpload={objectId => this.onUpload(item, objectId)} 
							onCheckbox={() => this.onCheckbox(item)} 
						/>
					) : ''}
					<ObjectName object={item} onMouseDown={e => this.onClick(e, item)} />
				</div>
			);
		};

		return (
			<div className={cn.join(' ')}>
				<div className="number">
					<div className="inner">{d}</div>
				</div>
				<div className="items">
					{items.map((item, i) => (
						<Item key={i} {...item} />
					))}
				</div>
			</div>
		);
	};

	componentDidMount () {
		this.rebind();
	};

	componentDidUpdate () {
		this.props.position();
	};

	componentWillUnmount() {
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onClick (e: any, item: any) {
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

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, block, getView, d, m, y } = data;
		const view = getView();
		const subId = dbStore.getSubId(rootId, block.id);
		const items = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, [ view.groupRelationKey ]));
		const current = [ d, m, y ].join('-');

		return items.filter(it => UtilDate.date('j-n-Y', it[view.groupRelationKey]) == current);
	};

});

export default MenuCalendarDay;
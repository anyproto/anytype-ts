import * as React from 'react';
import { IconObject, ObjectName } from 'Component';
import { I, UtilObject, keyboard } from 'Lib';
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
							onUpload={hash => this.onUpload(item, hash)} 
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

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { getSubId, getView, getDateParam, d, m, y } = data;
		const subId = getSubId();
		const view = getView();

		return dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id, [ view.groupRelationKey ])).filter(it => {
			const value = getDateParam(it[view.groupRelationKey]);
			return [ value.d, value.m, value.y ].join('-') == [ d, m, y ].join('-');
		});
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

	onUpload (item: any, hash: string) {
		UtilObject.setIcon(item.id, '', hash);
	};

	onCheckbox (item: any) {
		UtilObject.setDone(item.id, !item.done);
	};

});

export default MenuCalendarDay;
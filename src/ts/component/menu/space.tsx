import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName } from 'Component';
import { I, UtilCommon, UtilData, UtilObject, UtilRouter, keyboard } from 'Lib';
import { dbStore, detailStore, popupStore, commonStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

const MenuSpace = observer(class MenuSpace extends React.Component<I.Menu> {

	node: any = null;
	n = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.onSettings = this.onSettings.bind(this);
	};
	
	render () {
		const { setHover } = this.props;
		const items = this.getItems();
		const profile = UtilObject.getProfile();
		const { workspace } = blockStore;

		const Item = (item) => {
			const cn = [ 'item', 'space' ];

			if (item.id == workspace) {
				cn.push('isActive');
			};

			return (
				<div 
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onMouseEnter={e => this.onMouseEnter(e, item)} 
					onMouseLeave={e => setHover()}
				>
					<div className="iconWrap">
						<IconObject object={item} size={96} forceLetter={true} />
					</div>
					<ObjectName object={item} />
				</div>
			);
		};

		const ItemAdd = (item: any) => (
			<div 
				id="item-add" 
				className="item add" 
				onClick={this.onAdd}
				onMouseEnter={e => this.onMouseEnter(e, item)} 
				onMouseLeave={e => setHover()}
			/>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<div className="head">
					<div className="side left">
						<IconObject object={profile} size={40} />
						<ObjectName object={profile} onClick={this.onSettings} />
					</div>
					<div className="side left">
						<Icon className="settings" onClick={this.onSettings} />
					</div>
				</div>
				<div className="items">
					{items.map(item => {
						if (item.id == 'add') {
							return <ItemAdd key={`item-space-${item.id}`} {...item} />;
						} else {
							return <Item key={`item-space-${item.id}`} {...item} />;
						};
					})}
				</div>
			</div>
		);
	};

	componentDidMount (): void {
		const { space } = commonStore;
		const items = this.getItems();

		this.n = items.findIndex(it => it.spaceId == space);
		this.rebind();
	};

	componentDidUpdate (): void {
		this.beforePosition();
	};

	componentWillUnmount (): void {
		this.unbind();
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	onKeyDown (e: any) {
		let ret = false;

		keyboard.shortcut('arrowleft, arrowright, ctrl+tab', e, (pressed: string) => {
			this.onArrow(pressed == 'arrowleft' ? -1 : 1);
			ret = true;
		});

		if (!ret) {
			this.props.onKeyDown(e);
		};
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onArrow (dir: number) {
		const items = this.getItems();
		const max = items.length - 1;

		this.n += dir;

		if (this.n < 0) {
			this.n = max;
		};
		if (this.n > max) {
			this.n = 0;
		};

		this.props.setActive();
	};

	getItems () {
		const { space } = commonStore;
		const subId = Constant.subId.space;
		const items = UtilCommon.objectCopy(dbStore.getRecords(subId, '')).map(id => detailStore.get(subId, id, UtilData.spaceRelationKeys()));
		const canAdd = items.length < Constant.limit.space;

		items.sort((c1, c2) => {
			const isSpace1 = c1.spaceId == space;
			const isSpace2 = c2.spaceId == space;

			if (isSpace1 && !isSpace2) return -1;
			if (!isSpace1 && isSpace2) return 1;
			return 0;
		});

		if (canAdd) {
			items.push({ id: 'add' });
		};
		return items;
	};

	onClick (e: any, item: any) {
		if (item.id == 'add') {
			this.onAdd();
		} else {
			UtilRouter.switchSpace(item.targetSpaceId);
			this.props.close();
		};
	};

	onAdd () {
		popupStore.open('settings', { data: { page: 'spaceCreate', isSpace: true }, className: 'isSpaceCreate' });
		this.props.close();
	};

	onSettings () {
		popupStore.open('settings', {});
		this.props.close();
	};

	beforePosition () {
		const { getId } = this.props;
		const obj = $(`#${getId()}`);
		const { ww } = UtilCommon.getWindowDimensions();
		const sidebar = $('#sidebar');
		const sw = sidebar.outerWidth();

		obj.css({ maxWidth: ww - sw - 32 });
	};
	
});

export default MenuSpace;
import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName } from 'Component';
import { I, UtilCommon, UtilObject, UtilRouter, keyboard, translate, Action, analytics, Storage } from 'Lib';
import { authStore, dbStore, popupStore, menuStore, blockStore } from 'Store';
import Constant from 'json/constant.json';

const ITEM_WIDTH = 112;

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
		const { spaceview } = blockStore;

		const Item = (item) => {
			const cn = [ 'item', 'space' ];

			if (item.id == spaceview) {
				cn.push('isActive');
			};

			return (
				<div 
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onMouseEnter={e => this.onMouseEnter(e, item)} 
					onMouseLeave={e => setHover()}
					onContextMenu={e => this.onContextMenu(e, item)}
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
			>
				<div className="iconWrap" />
				<div className="name">{translate('commonCreateNew')}</div>
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<div className="head" onClick={this.onSettings}>
					<div className="side left">
						<IconObject object={profile} size={40} />
						<ObjectName object={profile} />
					</div>
					<div className="side right">
						<Icon className="settings" />
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
		const { param } = this.props;
		const { data } = param;
		const { shortcut } = data;
		const items = this.getItems();

		this.n = items.findIndex(it => it.isActive);
		this.rebind();

		if (shortcut) {
			this.onArrow(1);
		};
	};

	componentDidUpdate (): void {
		this.props.position();
	};

	componentWillUnmount (): void {
		this.unbind();
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on('keydown.menu', e => this.onKeyDown(e));
		win.on('keyup.menu', e => this.onKeyUp(e));

		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu keyup.menu');
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

	onKeyUp (e: any) {
		if (e.key.toLowerCase() == 'control') {
			this.onClick(e, this.getItems()[this.n]);
		};
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};

	onContextMenu (e: any, item: any) {
		const { param } = this.props;
		const { classNameWrap } = param;
		const { accountSpaceId } = authStore;

		if (item.targetSpaceId == accountSpaceId) {
			return;
		};

		menuStore.open('select', {
			classNameWrap,
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			data: {
				options: [
					{ id: 'remove', icon: 'remove', name: translate('commonDelete') }
				],
				onSelect: (e: any, element: any) => {
					switch (element.id) {
						case 'remove':
							Action.removeSpace(item.targetSpaceId, 'Navigation');
							break;
					};
				},
			},
		});
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

		if (items[this.n] && (items[this.n].id == 'add')) {
			this.onArrow(dir);
		} else {
			this.props.setActive();
		};
	};

	getItems () {
		const items = UtilCommon.objectCopy(dbStore.getSpaces());

		if (items.length < Constant.limit.space) {
			items.push({ id: 'add' });
		};
		return items;
	};

	onClick (e: any, item: any) {
		if (item.id == 'add') {
			this.onAdd();
		} else {
			UtilRouter.switchSpace(item.targetSpaceId);
			analytics.event('SwitchSpace');
			this.props.close();
		};
	};

	onAdd () {
		popupStore.open('settings', { 
			className: 'isSpaceCreate',
			data: { 
				page: 'spaceCreate', 
				isSpace: true,
				onCreate: (id) => {
					UtilRouter.switchSpace(id, '', () => Storage.initPinnedTypes());
					analytics.event('SwitchSpace');
				},
			}, 
		});
		
		this.props.close();
	};

	onSettings () {
		popupStore.open('settings', {});
		this.props.close();
	};

	beforePosition () {
		const node = $(this.node);
		const obj = node.find('.items');
		const { ww } = UtilCommon.getWindowDimensions();
		const sidebar = $('#sidebar');
		const sw = sidebar.outerWidth();
		const cols = Math.min(4, Math.floor((ww - sw - 64) / ITEM_WIDTH));

		obj.css({ gridTemplateColumns: `repeat(${cols}, 1fr)` });
	};
	
});

export default MenuSpace;
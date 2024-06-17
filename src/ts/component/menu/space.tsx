import * as React from 'react';
import { observer } from 'mobx-react';
import { IconObject, Icon, ObjectName } from 'Component';
import { I, UtilCommon, UtilSpace, UtilRouter, keyboard, translate, UtilMenu, analytics, Storage } from 'Lib';
import { commonStore, popupStore, blockStore } from 'Store';
const Constant = require('json/constant.json');

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
		const participant = UtilSpace.getParticipant();
		const { spaceview } = blockStore;

		const Item = (item) => {
			const cn = [ 'item', 'space' ];
			const icon = item.isShared ? 'shared' : '';

			if (item.id == spaceview) {
				cn.push('isActive');
			};

			return (
				<div 
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onMouseEnter={e => this.onMouseEnter(e, item)} 
					onMouseLeave={() => setHover()}
					onContextMenu={e => this.onContextMenu(e, item)}
				>
					<div className="iconWrap">
						<IconObject object={item} size={96} forceLetter={true} />
						{icon ? <Icon className={icon} /> : ''}
					</div>
					<ObjectName object={item} />
				</div>
			);
		};

		const ItemIcon = (item: any) => (
			<div 
				id={`item-${item.id}`} 
				className={`item ${item.id}`} 
				onClick={e => this.onClick(e, item)}
				onMouseEnter={e => this.onMouseEnter(e, item)} 
				onMouseLeave={e => setHover()}
			>
				<div className="iconWrap" />
				<div className="name">{item.name}</div>
			</div>
		);

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				<div className="head" onClick={this.onSettings}>
					<div className="side left">
						<IconObject object={participant} size={40} />
						<ObjectName object={participant} />
					</div>
					<div className="side right">
						<Icon className="settings" />
					</div>
				</div>
				<div className="items">
					{items.map(item => {
						if ([ 'add', 'gallery' ].includes(item.id)) {
							return <ItemIcon key={`item-space-${item.id}`} {...item} />;
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

		UtilMenu.spaceContext(item, {
			classNameWrap: param.classNameWrap,
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			route: analytics.route.navigation,
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

		if (items[this.n] && ([ 'add', 'gallery' ].includes(items[this.n].id))) {
			this.onArrow(dir);
		} else {
			this.props.setActive();
		};
	};

	getItems () {
		const { config } = commonStore;
		const items = UtilCommon.objectCopy(UtilSpace.getList());
		const length = items.length;

		items.push({ id: 'gallery', name: translate('commonGallery') });

		if (config.sudo || (length < Constant.limit.space)) {
			items.push({ id: 'add', name: translate('commonCreateNew') });
		};

		return items;
	};

	onClick (e: any, item: any) {
		this.props.close(() => {
			if (item.id == 'add') {
				this.onAdd();
			} else
			if (item.id == 'gallery') {
				popupStore.open('usecase', {});
			} else {
				UtilRouter.switchSpace(item.targetSpaceId);
				analytics.event('SwitchSpace');
			};
		});
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
	};

	onSettings () {
		this.props.close(() => {
			popupStore.open('settings', {});
		});
	};

	beforePosition () {
		const node = $(this.node);
		const obj = node.find('.items');
		const { ww } = UtilCommon.getWindowDimensions();
		const sidebar = $('#sidebar');
		const sw = sidebar.outerWidth();
		const items = this.getItems();
		
		let cols = Math.floor((ww - sw - 64) / ITEM_WIDTH);

		cols = Math.min(items.length, cols);
		cols = Math.max(4, cols);

		obj.css({ gridTemplateColumns: `repeat(${cols}, 1fr)` });
	};
	
});

export default MenuSpace;
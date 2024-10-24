import * as React from 'react';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { I, U, S, Key, keyboard, translate, analytics, Storage, Preview, sidebar, Action } from 'Lib';

import VaultItem from './item';

const Vault = observer(class Vault extends React.Component {
	
	node = null;
	isAnimating = false;
	checkKeyUp = false;
	closeSidebar = false;
	closeVault = false;
	top = 0;
	timeoutHover = 0;
	pressed = new Set();
	n = -1;

	constructor (props) {
		super(props);

		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};

    render () {
		const items = U.Menu.getVaultItems();

		const Item = item => {
			const onContextMenu = item.isButton ? null : e => this.onContextMenu(e, item);

			return (
				<VaultItem 
					id={item.id}
					isButton={item.isButton}
					onClick={e => this.onClick(e, item)}
					onMouseEnter={e => this.onMouseEnter(e, item)}
					onMouseLeave={() => this.onMouseLeave()}
					onContextMenu={onContextMenu}
				/>
			);
		};

		const ItemSortable = SortableElement(it => <Item {...it} index={it.index} />);

		const List = SortableContainer(() => (
			<div id="scroll" className="side top" onScroll={this.onScroll}>
				{items.map((item, i) => <ItemSortable {...item} key={`item-space-${item.id}`} index={i} />)}
			</div>
		));

        return (
            <div 
				ref={node => this.node = node}
				id="vault"
				className="vault"
            >
				<div className="head" />
				<div className="body">
					<List 
						axis="y" 
						lockAxis="y"
						lockToContainerEdges={true}
						transitionDuration={150}
						distance={10}
						onSortStart={this.onSortStart}
						onSortEnd={this.onSortEnd}
						helperClass="isDragging"
						helperContainer={() => $(`#vault .side.top`).get(0)}
					/>

					<div className="side bottom" onDragStart={e => e.preventDefault()}>
						<Item id="settings" isButton={true} name={translate('commonSettings')} />
					</div>
				</div>
            </div>
		);
    };

	componentDidMount (): void {
		this.resize();
		this.rebind();
	};

	componentDidUpdate (): void {
		$(this.node).find('#scroll').scrollTop(this.top);
		this.setActive(S.Block.spaceview);
	};

	componentWillUnmount (): void {
		this.unbind();
		window.clearTimeout(this.timeoutHover);
	};

	unbind () {
		const events = [ 'resize', 'keydown', 'keyup' ];
		const ns = 'vault';

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
	};

	rebind () {
		const win = $(window);

		this.unbind();
		win.on('resize.vault', () => this.resize());
		win.on('keydown.vault', e => this.onKeyDown(e));
		win.on('keyup.vault', e => this.onKeyUp(e));
	};

	getSpaceItems () {
		return U.Menu.getVaultItems().filter(it => !it.isButton);
	};

	onKeyDown (e: any) {
		const key = e.key.toLowerCase();
		const { isClosed, width } = sidebar.data;
		const { showVault } = S.Common;

		if ([ Key.ctrl, Key.tab, Key.shift ].includes(key)) {
			this.checkKeyUp = true;
			this.pressed.add(key);
		};

		if ([ Key.ctrl, Key.tab, Key.shift ].includes(key)) {
			this.pressed.add(key);
		};

		keyboard.shortcut('ctrl+tab, ctrl+shift+tab', e, pressed => {
			this.checkKeyUp = true;
			this.onArrow(pressed.match('shift') ? -1 : 1);

			if (!sidebar.isAnimating) {
				if (!showVault) {
					S.Common.showVaultSet(true);
					sidebar.resizePage(width, false);
					this.closeVault = true;
				};

				if (isClosed) {
					this.closeSidebar = true;
					sidebar.open(width);
				};
			};
		});
	};

	onKeyUp (e: any) {
		const key = String(e.key || '').toLowerCase();
		if (!key) {
			return;
		};

		this.pressed.delete(key);

		if (
			(this.pressed.has(Key.ctrl) || 
			this.pressed.has(Key.tab) || 
			this.pressed.has(Key.shift)) ||
			!this.checkKeyUp
		) {
			return;
		};

		this.checkKeyUp = false;

		const { width } = sidebar.data;
		const node = $(this.node);
		const items = this.getSpaceItems();
		const item = items[this.n];

		this.checkKeyUp = false;

		if (item) {
			node.find('.item.hover').removeClass('hover');
			if (item.targetSpaceId != S.Common.space) {
				U.Router.switchSpace(item.targetSpaceId, '', true, { animate: true });
			};
		};

		if (!sidebar.isAnimating) {
			if (this.closeVault) {
				S.Common.showVaultSet(false);
				sidebar.resizePage(width, false);
				this.closeVault = false;
			};

			if (this.closeSidebar) {
				sidebar.close();
				this.closeSidebar = false;
			};
		};

		Preview.tooltipHide();
	};

	onClick (e: any, item: any) {
		e.stopPropagation();

		switch (item.id) {
			case 'add': {
				this.onAdd();
				break;
			};

			case 'gallery': {
				S.Popup.open('usecase', {
					data: { 
						route: analytics.route.usecaseSite,
					},
				});
				break;
			};

			case 'settings': {
				S.Popup.open('settings', {});
				break;
			};

			default: {
				U.Router.switchSpace(item.targetSpaceId, '', true, { animate: true });
				break;
			};
		};
	};

	onArrow (dir: number) {
		const items = this.getSpaceItems();

		if (items.length == 1) {
			return;
		};
		
		this.n += dir;
		if (this.n < 0) {
			this.n = items.length - 1;
		};
		if (this.n >= items.length) {
			this.n = 0;
		};

		const next = items[this.n];
		if (next) {
			this.setHover(next);
		};
	};

	setActive (id: string) {
		const node = $(this.node);

		node.find('.item.isActive').removeClass('isActive');
		node.find(`#item-${id}`).addClass('isActive');

		this.n = this.getSpaceItems().findIndex(it => it.id == id);
	};

	setHover (item: any) {
		const node = $(this.node);
		const head = node.find('.head');
		const scroll = node.find('#scroll');
		const el = node.find(`#item-${item.id}`);
		const top = el.offset().top - scroll.position().top + this.top;
		const height = scroll.height();
		const hh = head.height();
		const ih = el.height() + 8;

		node.find('.item.hover').removeClass('hover');
		el.addClass('hover');

		let s = -1;
		if (top < this.top) {
			s = 0;
		};
		if (top + ih > height + this.top + hh) {
			s = this.top + height;
		};

		if (s >= 0) {
			Preview.tooltipHide(true);
			scroll.stop().animate({ scrollTop: s }, 200, 'swing', () => this.tooltipShow(item, 1));
		} else {
			this.tooltipShow(item, 1);
		};
	};

	onAdd () {
		Action.createSpace(analytics.route.vault);
	};

	onContextMenu (e: any, item: any) {
		U.Menu.spaceContext(item, {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			element: `#vault #item-${item.id}`,
			vertical: I.MenuDirection.Center,
			route: analytics.route.navigation,
		});
	};

	onSortStart () {
		keyboard.setDragging(true);
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;

		let ids = U.Menu.getVaultItems().map(it => it.id);
		ids = arrayMove(ids, oldIndex, newIndex);
		Storage.set('spaceOrder', ids, true);

		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		this.forceUpdate();
	};

	onScroll () {
		const node = $(this.node);
		const scroll = node.find('#scroll');

		this.top = scroll.scrollTop();
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isDragging) {
			this.tooltipShow(item, 300);
		};
	};

	onMouseLeave () {
		Preview.tooltipHide();
	};

	tooltipShow (item: any, delay: number) {
		const node = $(this.node);
		const element = node.find(`#item-${item.id}`);

		Preview.tooltipShow({ 
			text: item.name, 
			element, 
			className: 'fromVault', 
			typeX: I.MenuDirection.Left,
			typeY: I.MenuDirection.Center,
			offsetX: 44,
			delay,
		});
	};

	resize () {
		$(this.node).css({ height: U.Common.getWindowDimensions().wh });
	};

});

export default Vault;
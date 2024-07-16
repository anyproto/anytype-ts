import * as React from 'react';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { I, U, S, Key, keyboard, translate, analytics, Storage, Preview } from 'Lib';

import VaultItem from './item';

const Vault = observer(class Vault extends React.Component {
	
	node = null;
	isAnimating = false;
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
					item={item}
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

					<div className="side bottom">
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
		this.pressed.add(e.key.toLowerCase());

		keyboard.shortcut('ctrl+tab', e, () => {
			this.onArrow(1);
		});
	};

	onKeyUp (e: any) {
		this.pressed.delete(e.key.toLowerCase());

		if (this.pressed.has(Key.ctrl) || this.pressed.has(Key.tab)) {
			return;
		};

		const node = $(this.node);
		const items = this.getSpaceItems();
		const item = items[this.n];

		if (item) {
			node.find('.item.hover').removeClass('hover');
			U.Router.switchSpace(item.targetSpaceId, '', true);
			this.n = -1;
		};
	};

	onClick (e: any, item: any) {
		e.stopPropagation();

		switch (item.id) {
			case 'add': {
				this.onAdd();
				break;
			};

			case 'gallery': {
				S.Popup.open('usecase', {});
				break;
			};

			case 'settings': {
				S.Popup.open('settings', {});
				break;
			};

			default: {
				$(this.node).find('.item.hover').removeClass('hover');
				U.Router.switchSpace(item.targetSpaceId, '', true);
				break;
			};
		};
	};

	onArrow (dir: number) {
		const { spaceview } = S.Block;
		const items = this.getSpaceItems();
		
		this.n += dir;
		if (this.n < 0) {
			this.n = items.length - 1;
		};
		if (this.n >= items.length) {
			this.n = 0;
		};

		const next = items[this.n];
		if (!next) {
			return;
		};

		if ((next.id == spaceview) && (this.n === 0) && (items.length > 1)) {
			this.onArrow(dir);
			return;
		};

		this.setHover(next);
	};

	setActive (id: string) {
		const node = $(this.node);

		node.find('.item.isActive').removeClass('isActive');
		node.find(`#item-${id}`).addClass('isActive');
	};

	setHover (item: any) {
		const node = $(this.node);
		const scroll = node.find('#scroll');
		const el = node.find(`#item-${item.id}`);
		const top = el.position().top - scroll.position().top;
		const height = scroll.height();
		const ih = el.height() + 8;

		node.find('.item.hover').removeClass('hover');
		el.addClass('hover');

		const cb = () => {
			Preview.tooltipShow({ 
				text: item.name, 
				element: el, 
				className: 'fromVault', 
				typeX: I.MenuDirection.Left,
				typeY: I.MenuDirection.Center,
				offsetX: 62,
				delay: 1,
			});
		};

		let s = -1;
		if (top < 0) {
			s = 0;
		};
		if (top + ih > height - this.top) {
			s = this.top + height;
		};
		if (s >= 0) {
			Preview.tooltipHide(true);
			scroll.stop().animate({ scrollTop: s }, 200, 'swing', () => cb());
		} else {
			cb();
		};
	};

	onAdd () {
		S.Popup.open('settings', { 
			className: 'isSpaceCreate',
			data: { 
				page: 'spaceCreate', 
				isSpace: true,
				onCreate: (id) => {
					U.Router.switchSpace(id, '', true, () => Storage.initPinnedTypes());
				},
			}, 
		});
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
		if (keyboard.isDragging) {
			return;
		};

		Preview.tooltipShow({ 
			text: item.name, 
			element: $(e.currentTarget), 
			className: 'fromVault', 
			typeX: I.MenuDirection.Left,
			typeY: I.MenuDirection.Center,
			offsetX: 62,
			delay: 300,
		});
	};

	onMouseLeave () {
		Preview.tooltipHide();
	};

	resize () {
		$(this.node).css({ height: U.Common.getWindowDimensions().wh });
	};

});

export default Vault;
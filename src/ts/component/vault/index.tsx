import * as React from 'react';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { IconObject } from 'Component';
import { I, U, S, keyboard, translate, analytics, Storage, sidebar, Preview } from 'Lib';

const Vault = observer(class Vault extends React.Component {
	
	node = null;
	isAnimating = false;
	top = 0;
	timeoutHover = 0;
	id = '';

	constructor (props) {
		super(props);

		this.onToggle = this.onToggle.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onScroll = this.onScroll.bind(this);
	};

    render () {
		const items = U.Menu.getVaultItems();
		const { spaceview } = S.Block;

		const Item = SortableElement(item => {
			const cn = [ 'item' ];

			if (item.id == spaceview) {
				cn.push('isActive');
			};

			let descr = null;
			if (item.isPersonal) {
				descr = translate(`spaceAccessType${item.spaceAccessType}`);
			};

			return (
				<div 
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onClick={e => this.onClick(e, item)}
					onMouseEnter={e => this.onMouseEnter(e, item)}
					onMouseLeave={() => this.onMouseLeave()}
					onContextMenu={e => this.onContextMenu(e, item)}
				>
					<div className="iconWrap">
						<div className="border" />
						<IconObject object={item} size={48} forceLetter={true} />
					</div>
				</div>
			);
		});

		const ItemIcon = item => (
			<div 
				id={`item-${item.id}`} 
				className={`item ${item.id}`} 
				onClick={e => this.onClick(e, item)}
				onMouseEnter={e => this.onMouseEnter(e, item)}
				onMouseLeave={() => this.onMouseLeave()}
			>
				<div className="iconWrap">
					<div className="border" />
				</div>
			</div>
		);

		const ItemIconSortable = SortableElement(it => <ItemIcon {...it} index={it.index} />);

		const List = SortableContainer(() => (
			<div id="scroll" className="side top" onScroll={this.onScroll}>
				{items.map((item, i) => {
					item.key = `item-space-${item.id}`;

					let content = null;
					if ([ 'void', 'gallery', 'add' ].includes(item.id)) {
						content = <ItemIconSortable {...item} index={i} />;
					} else {
						content = <Item {...item} index={i} />;
					};

					return content;
				})}
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
						<ItemIcon id="settings" name={translate('commonSettings')} />
					</div>

					<div id="line" className="line" />
				</div>	
            </div>
		);
    };

	componentDidMount (): void {
		this.resize();
		this.rebind();
	};

	componentDidUpdate (): void {
		const node = $(this.node);
		const scroll = node.find('#scroll');

		scroll.scrollTop(this.top);
	};

	componentWillUnmount (): void {
		this.unbind();
		window.clearTimeout(this.timeoutHover);
	};

	unbind () {
		$(window).off('resize.vault');
	};

	rebind () {
		this.unbind();
		$(window).on('resize.vault', () => this.resize());
	};

	onClick (e: any, item: any) {
		e.stopPropagation();

		switch (item.id) {
			case 'add':
				this.onAdd();
				break;

			case 'void':
				this.onToggle();
				break;

			case 'gallery':
				S.Popup.open('usecase', {});
				break;

			case 'settings':
				S.Popup.open('settings', {});
				break;

			default:
				U.Router.switchSpace(item.targetSpaceId);
				analytics.event('SwitchSpace');
				break;
		};
	};

	setActive (id: string) {
		const node = $(this.node);

		node.find('.item.isActive').removeClass('isActive');
		node.find(`#item-${id}`).addClass('isActive');
	};

	onAdd () {
		S.Popup.open('settings', { 
			className: 'isSpaceCreate',
			data: { 
				page: 'spaceCreate', 
				isSpace: true,
				onCreate: (id) => {
					U.Router.switchSpace(id, '', () => Storage.initPinnedTypes());
					analytics.event('SwitchSpace');
				},
			}, 
		});
	};

	onContextMenu (e: any, item: any) {
		U.Menu.spaceContext(item, {
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			route: analytics.route.navigation,
		});
	};

	onToggle () {
		if (this.isAnimating) {
			return;
		};

		const { wh } = U.Common.getWindowDimensions();
		const node = $(this.node);
		const container = $('#vaultContentContainer');
		const isExpanded = node.hasClass('isExpanded');

		node.toggleClass('isExpanded');
		container.toggleClass('isExpanded');
		container.css({ height: !isExpanded ? wh : '' });

		this.isAnimating = true;
		sidebar.resizePage(null, false);

		window.setTimeout(() => this.isAnimating = false, 300);
	};

	onSortStart () {
		keyboard.setDragging(true);
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;

		let ids = U.Menu.getVaultItems().map(it => it.id)
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
			title: item.name, 
			element: $(e.currentTarget), 
			className: 'big fromVault', 
			typeX: I.MenuDirection.Left,
			typeY: I.MenuDirection.Center,
			offsetX: 66,
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
import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import arrayMove from 'array-move';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';
import { Icon, IconObject, ObjectName } from 'Component';
import { U, S, keyboard, translate, analytics, Storage, sidebar, Preview } from 'Lib';

const Vault = observer(class Vault extends React.Component {
	
	node = null;
	isAnimating = false;
	top = 0;
	timeoutHover = 0;
	id = '';

	constructor (props) {
		super(props);

		this.onToggle = this.onToggle.bind(this);
		this.onSettings = this.onSettings.bind(this);
		this.onSortStart = this.onSortStart.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
	};

    render () {
		const items = this.getItems();
		const { spaceview } = S.Block;

		const Item = SortableElement(item => {
			const cn = [ 'item', 'space' ];
			const icon = item.isShared ? 'shared' : '';

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
						<IconObject object={item} size={48} forceLetter={true} tooltip={item.name} />
						{icon ? <Icon className={icon} /> : ''}
					</div>
					<div className="coverWrap">
						<IconObject object={item} size={360} forceLetter={true} />
					</div>
					<div className="infoWrap">
						<ObjectName object={item} />
						<div className="descr">
							{descr}
						</div>
					</div>
				</div>
			);
		});

		const ItemIcon = SortableElement((item: any) => (
			<div 
				id={`item-${item.id}`} 
				className={`item ${item.id}`} 
				onClick={e => this.onClick(e, item)}
				onMouseEnter={e => this.onMouseEnter(e, item)}
				onMouseLeave={() => this.onMouseLeave()}
			>
				<div className="iconWrap" />
				<div className="infoWrap">
					<div className="name">{item.name}</div>
				</div>
			</div>
		));

		const ItemAdd = SortableElement((item: any) => (
			<div 
				id={`item-${item.id}`} 
				className={`item ${item.id}`} 
				onClick={e => this.onClick(e, item)}
				onMouseEnter={e => this.onMouseEnter(e, item)}
				onMouseLeave={() => this.onMouseLeave()}
			>
				<div className="iconWrap" />
			</div>
		));

		const List = SortableContainer(() => (
			<div id="scroll" className="side top">
				{items.map((item, i) => {
					item.key = `item-space-${item.id}`;

					let content = null;
					if (item.id == 'add') {
						content = <ItemAdd {...item} index={i} />;
					} else 
					if ([ 'void', 'gallery' ].includes(item.id)) {
						content = <ItemIcon {...item} index={i} />;
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
				{/*
				<div className="head">
					<Icon className="settings" onClick={this.onSettings} />
					<Icon className="close" onClick={this.onToggle} />
				</div>
				*/}
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
					<div className="side bottom" onClick={this.onSettings}>
						<div className="item settings">
							<div className="iconWrap" />
						</div>
					</div>

					<div id="line" className="line" />
				</div>	
            </div>
		);
    };

	componentDidMount(): void {
		this.resize();
		this.rebind();
	};

	componentWillUnmount(): void {
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

	getItems () {
		const ids = Storage.get('vaultOrder') || [];
		const items = U.Common.objectCopy(U.Space.getList());

		//items.unshift({ id: 'void' });
		items.push({ id: 'gallery', name: translate('commonGallery') });

		if (U.Space.canCreateSpace()) {
			items.push({ id: 'add', name: translate('commonCreateNew') });
		};

		if (ids && (ids.length > 0)) {
			items.sort((c1, c2) => {
				const i1 = ids.indexOf(c1.id);
				const i2 = ids.indexOf(c2.id);

				if (i1 > i2) return 1;
				if (i1 < i2) return -1;
				return 0;
			});
		};

		return items;
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

			default:
				U.Router.switchSpace(item.targetSpaceId, '', () => this.unsetLine());
				analytics.event('SwitchSpace');
				break;
		};
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

	onSettings () {
		S.Popup.open('settings', {});
	};

	onSortStart () {
		keyboard.disableSelection(true);
	};

	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;

		let ids = this.getItems().map(it => it.id)
		ids = arrayMove(ids, oldIndex, newIndex);
		Storage.set('vaultOrder', ids, true);

		keyboard.disableSelection(false);
		this.forceUpdate();
	};

	onMouseEnter (e: any, item: any) {
		Preview.tooltipShow({ text: item.name, element: $(e.currentTarget) })
		
		window.clearTimeout(this.timeoutHover);
		this.setLine(item.id);
	};

	onMouseLeave () {
		Preview.tooltipHide();

		window.clearTimeout(this.timeoutHover);
		this.timeoutHover = window.setTimeout(() => this.unsetLine(), 40);	
	};

	setLine (id: string) {
		const node = $(this.node);
		const line = node.find('#line');
		const el = node.find(`#item-${id}`);
		if (!el.length) {
			return;
		};

		const top = el.position().top;

		if (this.id) {
			line.css({ transform: `translate3d(0px,${top}px,0px)`});
		} else {
			line.removeClass('anim');
			line.css({ transform: `translate3d(-100%,${top}px,0px)`});

			raf(() => {
				line.addClass('anim');
				line.css({ transform: `translate3d(0px,${top}px,0px)`});
			});
		};

		this.id = id;
	};

	unsetLine () {
		if (!this.id) {
			return;
		};

		const node = $(this.node);
		const line = node.find('#line');
		const el = node.find(`#item-${this.id}`);

		if (!el.length) {
			return;
		};

		line.addClass('anim');
		line.css({ transform: `translate3d(-100%,${el.position().top}px,0px)`});

		this.id = '';
	};

	resize () {
		$(this.node).css({ height: U.Common.getWindowDimensions().wh });
	};

});

export default Vault;
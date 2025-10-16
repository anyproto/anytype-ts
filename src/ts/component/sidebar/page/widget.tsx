import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { arrayMove } from '@dnd-kit/sortable';
import { Button, Icon, Widget, DropTarget, Label, IconObject, ObjectName, Sync } from 'Component';
import { I, C, M, S, U, J, keyboard, analytics, translate, scrollOnMove, Preview, sidebar, Storage, Dataview } from 'Lib';

type State = {
	previewId: string;
	sectionIds: I.WidgetSection[];
};

const SidebarPageWidget = observer(class SidebarPageWidget extends React.Component<I.SidebarPageComponent, State> {
		
	state: State = {
		previewId: '',
		sectionIds: [],
	};

	dropTargetId = '';
	position: I.BlockPosition = null;
	isDragging = false;
	frame = 0;
	timeout = 0;
	top = 0;
	node = null;
	body = null;

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDrag = this.onDrag.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.setPreview = this.setPreview.bind(this);
		this.onHelp = this.onHelp.bind(this);
		this.onPlusHover = this.onPlusHover.bind(this);
		this.onBack = this.onBack.bind(this);
		this.getObject = this.getObject.bind(this);
		this.initToggle = this.initToggle.bind(this);
	};

	render (): React.ReactNode {
		const { previewId, sectionIds } = this.state;
		const { widgets } = S.Block;
		const { sidebarDirection } = this.props;
		const cnsh = [ 'subHead' ];
		const cnb = [ 'body' ];
		const spaceview = U.Space.getSpaceview();
		const canWrite = U.Space.canMyParticipantWrite();
		const counters = S.Chat.getTotalCounters();
		const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
		const isMuted = spaceview.notificationMode != I.NotificationMode.All;

		// Subscriptions
		for (const key of U.Subscription.fileTypeKeys()) {
			const { total } = S.Record.getMeta(U.Subscription.typeCheckSubId(key), '');
		};

		if (counters.messageCounter) {
			cnsh.push('withCounter');
		};

		let headerButtons: any[] = [];
		if (spaceview.isChat) {
			headerButtons = headerButtons.concat([
				{ id: 'chat', name: translate('commonChat') },
				{ id: 'mute', name: isMuted ? translate('commonUnmute') : translate('commonMute'), className: isMuted ? 'off' : 'on' },
				{ id: 'settings', name: translate('commonSettings') }
			]);
		};

		let content = null;
		let first = null;
		let subHead = null;

		if (previewId) {
			cnb.push('isPreview');
			const block = S.Block.getLeaf(widgets, previewId);

			if (block) {
				const child = this.getChild(block.id);
				const object = this.getObject(block, child?.getTargetObjectId());
				const param = U.Data.widgetContentParam(object, block);
				const hasMenu = [ I.WidgetLayout.View, I.WidgetLayout.List, I.WidgetLayout.Compact ].includes(param.layout);

				let icon = null;
				let buttons = null;

				if (object.isSystem) {
					icon = <Icon className={object.icon} />;
				} else {
					icon = <IconObject object={object} size={20} iconSize={20} canEdit={false} />;
					buttons = (
						<>
							<Icon className="expand withBackground" onClick={this.onExpand} />
							{hasMenu ? <Icon id="button-widget-more" className="more withBackground" onClick={this.onMore} /> : ''}
						</>
					);
				};

				subHead = (
					<div className={cnsh.join(' ')}>
						<div className="side left">
							<Icon className="back" onClick={e => {
								e.stopPropagation();

								this.setPreview('');
								analytics.event('ScreenHome', { view: 'Widget' });
							}} />
						</div>

						<div className="side center">
							{icon}
							<ObjectName object={object} withPlural={true} />
						</div>

						<div className="side right">
							{buttons}
						</div>
					</div>
				);

				content = (
					<Widget 
						{...this.props}
						key={`widget-${block.id}`}
						block={block}
						isPreview={true}
						setPreview={this.setPreview}
						canEdit={canWrite}
						canRemove={false}
						getObject={id => this.getObject(block, id)}
					/>
				);
			};
		} else {
			const blockWidgets = this.getBlockWidgets();
			const spaceBlock = new M.Block({ id: 'space', type: I.BlockType.Widget, content: { layout: I.WidgetLayout.Space } });
			const sections = [
				{ id: I.WidgetSection.Pin, name: translate('widgetSectionPinned') },
				{ id: I.WidgetSection.Type, name: translate('widgetSectionType') },
			];

			if (blockWidgets.length) {
				first = blockWidgets[0];
			};

			content = (
				<div className="content">
					<Widget
						block={spaceBlock}
						disableContextMenu={true}
						onDragStart={this.onDragStart}
						onDragOver={this.onDragOver}
						onDrag={this.onDrag}
						canEdit={false}
						canRemove={false}
						disableAnimation={true}
						sidebarDirection={sidebarDirection}
						getObject={id => this.getObject(spaceBlock, id)}
					/>

					{sections.map(section => {
						const isSectionPin = section.id == I.WidgetSection.Pin;
						const isSectionType = section.id == I.WidgetSection.Type;
						const cns = [ 'widgetSection', `section-${I.WidgetSection[section.id].toLowerCase()}` ];

						let list = blockWidgets.filter(it => it.content.section == section.id);
						let buttons = null;

						if (isSectionType) {
							if (canWrite) {
								buttons = <Button icon="plus" color="blank" className="c28" text={translate('widgetSectionNewType')} onClick={this.onTypeCreate} />;
							};

							if (sectionIds.includes(section.id) && (list.length > 1)) {
								list = list.sort((a, b) => {
									const c1 = this.getChild(a.id);
									const c2 = this.getChild(b.id);

									const t1 = c1?.getTargetObjectId();
									const t2 = c2?.getTargetObjectId();

									if (!t1 || !t2) {
										return 0;
									};

									const type1 = S.Record.getTypeById(t1);
									const type2 = S.Record.getTypeById(t2);

									if (!type1 || !type2) {
										return 0;
									};

									return U.Data.sortByOrderId(type1, type2);
								});
							};
						};

						if (isSectionPin && !list.length) {
							return null;
						};

						return (
							<div id={`section-${section.id}`} className={cns.join(' ')} key={section.id}>
								<div className="nameWrap">
									<div className="name" onClick={() => this.onToggle(section.id)}>
										<Icon className="arrow" />
										{section.name}
									</div>
									<div className="buttons">
										{buttons}
									</div>
								</div>

								{sectionIds.includes(section.id) ? (
									<div className="items">
										{list.map((block, i) => (
											<Widget
												{...this.props}
												key={`widget-${block.id}`}
												block={block}
												canEdit={canWrite}
												canRemove={isSectionPin}
												onDragStart={this.onDragStart}
												onDragOver={this.onDragOver}
												onDrag={this.onDrag}
												setPreview={this.setPreview}
												sidebarDirection={sidebarDirection}
												getObject={id => this.getObject(block, id)}
											/>
										))}
									</div>
								) : ''}
							</div>
						);
					})}
				</div>
			);
		};

		return (
			<>
				<div id="head" className="head">
					<div className="side left">
						<Sync id="headerSync" onClick={this.onSync} />
					</div>
					<div className="side right">
						<Icon className="search withBackground" onClick={() => keyboard.onSearchPopup(analytics.route.widget)} />
					</div>
				</div>

				{subHead}

				<div
					id="body"
					className={cnb.join(' ')}
					onScroll={this.onScroll}
					onDrop={this.onDrop}
					onDragOver={e => e.preventDefault()}
				>
					{content}
				</div>
			</>
		);
	};

	componentDidMount(): void {
		this.init();

		$(window).off('checkWidgetToggles').on('checkWidgetToggles', () => this.init());
	};

	componentDidUpdate (): void {
		this.init();
	};

	componentWillUnmount(): void {
		$(window).off('checkWidgetToggles');
	};

	init () {
		const { sidebarDirection, isPopup, getId } = this.props;

		this.node = $(`#${getId()}`);
		this.body = this.node.find('#body');

		U.Subscription.createTypeCheck(() => {
			S.Block.updateTypeWidgetList();

			const top = Storage.getScroll('sidebarWidget', sidebarDirection, isPopup);
			const sectionIds = [];
			const ids = [ I.WidgetSection.Pin, I.WidgetSection.Type ];

			ids.forEach(id => {
				if (!this.isSectionClosed(id)) {
					sectionIds.push(id);
				};
			});

			if (!U.Common.compareJSON(sectionIds, this.state.sectionIds)) {
				this.setState({ sectionIds });
			} else {
				ids.forEach(this.initToggle);
			};

			this.body.scrollTop(top);
			this.onScroll();
		});
	};

	onPlusHover (e: any) {
		const t = Preview.tooltipCaption(translate('commonNew'), [ 
			keyboard.getCaption('createObject'), 
			keyboard.getCaption('selectType'),
		].join(' / '));

		Preview.tooltipShow({ text: t, element: $(e.currentTarget) });
	};

	onSync = () => {
		S.Menu.closeAllForced(null, () => {
			S.Menu.open('syncStatus', {
				element: '#headerSync',
				offsetY: 4,
				classNameWrap: 'fixed fromSidebar',
				subIds: J.Menu.syncStatus,
			});
		});
	};

	onBack = () => {
		S.Common.setLeftSidebarState('vault', '');
	};

	onHelp () {
		const { sidebarDirection, getId } = this.props;
		const menuHelpOffset = U.Data.isFreeMember() ? -78 : -4;

		S.Menu.open('help', {
			element: `#${getId()} #button-help`,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			vertical: I.MenuDirection.Top,
			horizontal: sidebarDirection == I.SidebarDirection.Left ? I.MenuDirection.Left : I.MenuDirection.Right,
			offsetY: menuHelpOffset,
			subIds: J.Menu.help,
		});
	};

	onDragStart (e: React.DragEvent, block: I.Block): void {
		e.stopPropagation();

		const canWrite = U.Space.canMyParticipantWrite();
		if (!canWrite) {
			return;
		};

		const child = this.getChild(block.id);
		if (!child) {
			return;
		};

		const targetId = child.getTargetObjectId();

		if ([ J.Constant.widgetId.bin ].includes(targetId)) {
			e.preventDefault();
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const obj = this.node.find(`#widget-${block.id}`);
		const clone = $('<div />').addClass('widget isClone').css({ 
			zIndex: 10000, 
			position: 'fixed', 
			left: -10000, 
			top: -10000,
			width: obj.outerWidth(),
		});

		clone.append(obj.find('.head').clone());
		this.node.append(clone);
		selection?.clear();
		$('body').addClass('isDragging');

		keyboard.disableCommonDrop(true);
		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		this.isDragging = true;

		e.dataTransfer.setDragImage(clone.get(0), 0, 0);
		e.dataTransfer.setData('text', JSON.stringify({ blockId: block.id, section: block.content.section }));

		win.off('dragend.widget').on('dragend.widget', () => {
			this.onDragEnd();
			win.off('dragend.widget');
		});

		scrollOnMove.onMouseDown({ container: this.body, speed: 300, step: 1 });
	};

	onDrag (e: React.DragEvent, block: I.Block): void {
		scrollOnMove.onMouseMove(e.clientX, e.clientY);
	};

	onDragOver (e: React.DragEvent, block: I.Block) {
		if (!this.isDragging) {
			return;
		};

		e.preventDefault();

		const target = $(e.currentTarget);
		const y = e.pageY;

		raf.cancel(this.frame);
		this.frame = raf(() => {
			this.clear();
			this.dropTargetId = block.id;

			const { top } = target.offset();
			const height = target.height();
			const child = this.getChild(block.id);

			this.position = y <= top + height / 2 ? I.BlockPosition.Top : I.BlockPosition.Bottom;

			if (child) {
				const t = child.getTargetObjectId();
				if (t == J.Constant.widgetId.bin) {
					this.position = I.BlockPosition.Top;
				};
			};

			target.addClass([ 'isOver', (this.position == I.BlockPosition.Top ? 'top' : 'bottom') ].join(' '));
		});
	};

	onDrop (e: React.DragEvent): void {
		if (!this.isDragging) {
			return;
		};

		e.stopPropagation();

		let data: any = {};
		try {
			data = JSON.parse(e.dataTransfer.getData('text'));
		} catch (err) {
			return;
		};

		const { widgets } = S.Block;
		const { blockId, section } = data;

		if (blockId == this.dropTargetId) {
			this.onDragEnd();
			return;
		};

		switch (section) {
			case I.WidgetSection.Pin: {
				C.BlockListMoveToExistingObject(widgets, widgets, this.dropTargetId, [ blockId ], this.position);
				break;
			};

			case I.WidgetSection.Type: {
				const child1 = this.getChild(blockId);
				const targetId1 = child1?.getTargetObjectId();
				const child2 = this.getChild(this.dropTargetId);
				const targetId2 = child2?.getTargetObjectId();

				if (!targetId1 || !targetId2 || (targetId1 == targetId2)) {
					break;
				};

				const items = S.Record.checkHiddenObjects(S.Record.getTypes());
				const oldIndex = items.findIndex(it => it.id == targetId1);
				let newIndex = items.findIndex(it => it.id == targetId2) + (this.position == I.BlockPosition.Bottom ? 1 : 0);

				if ((oldIndex < 0) || (newIndex < 0)) {
					break;
				};

				if (oldIndex < newIndex) {
					newIndex--;
				};

				const newItems = arrayMove(items, oldIndex, newIndex);

				U.Data.sortByOrderIdRequest(J.Constant.subId.type, newItems, callBack => {
					C.ObjectTypeSetOrder(S.Common.space, newItems.map(it => it.id), callBack);
				});
				break;
			};
		};

		this.onDragEnd();
	};

	onDragEnd () {
		keyboard.disableCommonDrop(false);
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		this.isDragging = false;
		this.clear();

		$('body').removeClass('isDragging');
	};

	onScroll () {
		const { sidebarDirection, isPopup } = this.props;
		const { previewId } = this.state;
		const top = this.body.scrollTop();

		if (!previewId) {
			Storage.setScroll('sidebarWidget', sidebarDirection, top, isPopup);
		};
	};

	onTypeCreate = () => {
		U.Object.createType({}, false);
	};

	onExpand = (e: any) => {
		const { previewId } = this.state;
		const { widgets } = S.Block;
		const block = S.Block.getLeaf(widgets, previewId);

		if (!block) {
			return;
		};

		const child = this.getChild(block.id);
		const targetId = child?.getTargetObjectId();
		const rootId = this.getChildRootId(targetId, child.id);
		const object = this.getObject(block, targetId);
		const param = U.Data.widgetContentParam(object, block);
		const view = Dataview.getView(rootId, J.Constant.blockId.dataview, param.viewId);

		S.Common.routeParam = { ref: 'widget', viewId: view?.id };
		U.Object.openEvent(e, object);
	};

	onMore = (e: any) => {
		e.stopPropagation();

		const { getId } = this.props;
		const { previewId } = this.state;
		const { widgets } = S.Block;
		const block = S.Block.getLeaf(widgets, previewId);

		if (!block) {
			return;
		};

		const child = this.getChild(block.id);
		const targetId = child?.getTargetObjectId();
		const object = this.getObject(block, targetId);
		const rootId = this.getChildRootId(targetId, child.id);
		const param = U.Data.widgetContentParam(object, block);
		const view = Dataview.getView(rootId, J.Constant.blockId.dataview, param.viewId);

		if (!view) {
			return;
		};

		const sort: any = view.sorts.length ? view.sorts[0] : {};

		let relationKey = sort.relationKey;
		let type = sort.type;
		let menuContext = null;

		S.Menu.open('select', {
			element: `#${getId()} #button-widget-more`,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: context => menuContext = context,
			data: {
				options: this.getPreviewOptions(param, relationKey, type),
				noClose: true,
				onSelect: (e: any, item: any) => {
					const cb = () => {
						menuContext.close();
					};

					if (item.isLayout) {
						switch (block.content.section) {
							case I.WidgetSection.Pin: {
								C.BlockWidgetSetLayout(widgets, block.id, item.layout, cb);
								break;
							};

							case I.WidgetSection.Type: {
								C.ObjectListSetDetails([ targetId ], [ { key: 'widgetLayout', value: Number(item.layout) } ], cb);
								break;
							};
						};
					} else
					if (item.isSort) {
						relationKey = item.relationKey;
						type = item.type;

						sort.relationKey = relationKey;
						sort.type = type;

						C.BlockDataviewSortReplace(targetId, J.Constant.blockId.dataview, view.id, sort.id, { ...sort }, cb);
					};
				},
			}
		});
	};

	getPreviewOptions = (param: any, relationKey: string, sortType: I.SortType) => {
		const { previewId } = this.state;
		const { widgets } = S.Block;
		const block = S.Block.getLeaf(widgets, previewId);
		const child = this.getChild(block.id);
		const object = this.getObject(block, child?.getTargetObjectId());
		const layoutOptions = U.Menu.prepareForSelect(U.Menu.getWidgetLayoutOptions(object?.id, object?.layout, true));
		const appearance: any[] = layoutOptions.map(it => ({ isLayout: true, layout: it.id, name: it.name, checkbox: it.id == param.layout}));

		appearance.unshift({ isSection: true, name: translate('commonAppearance') });

		const options: any[] = appearance.concat([
			{ isDiv: true },
			{ isSection: true, name: translate('sidebarObjectSort') },
			{ isSort: true, name: translate('sidebarObjectSortUpdated'), type: I.SortType.Asc, relationKey: 'lastModifiedDate', defaultType: I.SortType.Desc },
			{ isSort: true, name: translate('sidebarObjectSortCreated'), type: I.SortType.Asc, relationKey: 'createdDate', defaultType: I.SortType.Desc },
			{ isSort: true, name: translate('commonName'), type: I.SortType.Asc, relationKey: 'name', defaultType: I.SortType.Asc },
		]);

		return options.map(it => {
			if (it.isLayout) {
				it.id = `layout-${it.layout}`;
			};
			if (it.isSort) {
				it.id = `sort-${it.relationKey}-${it.type}`;
			};

			if (it.relationKey == relationKey) {
				it.type = sortType == I.SortType.Asc ? I.SortType.Desc : I.SortType.Asc;
				it.sortArrow = sortType;
			};
			return it;
		});
	};

	isSectionClosed (id: I.WidgetSection) {
		return Storage.checkToggle('widgetSection', String(id));
	};

	initToggle (id: I.WidgetSection) {
		const section = this.node.find(`#section-${id}`);
		const list = section.find('> .items');
		const isClosed = this.isSectionClosed(id);

		section.toggleClass('isOpen', !isClosed);
		list.toggleClass('isOpen', !isClosed).css({ 
			height: (isClosed ? 0 : 'auto'),
			overflow: (isClosed ? 'hidden' : 'visible'),
		});
	};

	onToggle = (id: I.WidgetSection) => {
		const section = this.node.find(`#section-${id}`);
		const list = section.find('> .items');
		const isClosed = this.isSectionClosed(id);
		const save = () => Storage.setToggle('widgetSection', String(id), !isClosed);

		let sectionIds = [ ...this.state.sectionIds ];
		sectionIds = isClosed ? sectionIds.concat(id) : sectionIds.filter(it => it != id);

		if (isClosed) {
			save();
			this.setState({ sectionIds }, () => {
				U.Common.toggle(list, 200, false);
			});
		} else {
			U.Common.toggle(list, 200, true, () => {
				save();
				this.setState({ sectionIds });
			});
		};
	};

	clear () {
		this.node.find('.widget.isOver').removeClass('isOver top bottom');
		this.node.find('.widget.isClone').remove();

		this.dropTargetId = '';
		this.position = null;

		raf.cancel(this.frame);
	};

	setPreview (previewId: string) {
		this.setState({ previewId });
	};

	getBlockWidgets = () => {
		const { widgets } = S.Block;

		const blocks = S.Block.getChildren(widgets, widgets, (block: I.Block) => {
			if (!block.isWidget()) {
				return false;
			};

			const child = this.getChild(block.id);
			if (!child) {
				return false;
			};

			const target = child.getTargetObjectId();

			if ([ J.Constant.widgetId.allObject, J.Constant.widgetId.chat ].includes(target)) {
				return false;
			};

			if ([ J.Constant.widgetId.bin ].includes(target) && (block.content.section == I.WidgetSection.Pin)) {
				return false;
			};

			if (Object.values(J.Constant.widgetId).includes(target)) {
				return true;
			};

			const object = this.getObject(block, target);

			if (!object || object._empty_ || object.isArchived || object.isDeleted) {
				return false;
			};

			return true;
		});

		blocks.sort((a: I.Block, b: I.Block) => {
			const c1 = this.getChild(a.id);
			const c2 = this.getChild(b.id);

			const t1 = c1?.getTargetObjectId();
			const t2 = c2?.getTargetObjectId();

			const isBin1 = t1 == J.Constant.widgetId.bin;
			const isBin2 = t2 == J.Constant.widgetId.bin;

			if (isBin1 && !isBin2) return 1;
			if (!isBin1 && isBin2) return -1;

			return 0;
		});

		return blocks;
	};

	getChild (id: string): I.Block {
		const { widgets } = S.Block;
		const childrenIds = S.Block.getChildrenIds(widgets, id);

		if (!childrenIds.length) {
			return null;
		};

		return S.Block.getLeaf(widgets, childrenIds[0]);
	};

	getChildRootId (targetId: string, blockId: string): string {
		return [ targetId, 'widget', blockId ].join('-');
	};

	getObject = (block: I.Block, id: string) => {
		if (!id) {
			return null;
		};

		const { widgets } = S.Block;

		let object = null;
		if (U.Menu.isSystemWidget(id)) {
			object = U.Menu.getSystemWidgets().find(it => it.id == id);
		} else 
		if (block.content.section == I.WidgetSection.Type) {
			object = S.Detail.get(J.Constant.subId.type, id);
		} else {
			object = S.Detail.get(widgets, id);
		};
		return object;
	};

});

export default SidebarPageWidget;
import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { arrayMove } from '@dnd-kit/sortable';
import { Button, Icon, Widget, DropTarget, Label, IconObject, ObjectName } from 'Component';
import { I, C, M, S, U, J, keyboard, analytics, translate, scrollOnMove, Preview, sidebar, Storage, Dataview } from 'Lib';

type State = {
	isEditing: boolean;
	previewId: string;
	sectionIds: I.WidgetSection[];
};

const SidebarPageWidget = observer(class SidebarPageWidget extends React.Component<I.SidebarPageComponent, State> {
		
	state: State = {
		isEditing: false,
		previewId: '',
		sectionIds: [],
	};

	dropTargetId = '';
	position: I.BlockPosition = null;
	isDragging = false;
	frame = 0;
	timeout = 0;

	constructor (props: I.SidebarPageComponent) {
		super(props);

		this.onEdit = this.onEdit.bind(this);
		this.onDragStart = this.onDragStart.bind(this);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDrag = this.onDrag.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.onArchive = this.onArchive.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.setEditing = this.setEditing.bind(this);
		this.setPreview = this.setPreview.bind(this);
		this.onHelp = this.onHelp.bind(this);
		this.onPlusHover = this.onPlusHover.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onArrow = this.onArrow.bind(this);
		this.onBack = this.onBack.bind(this);
		this.getObject = this.getObject.bind(this);
		this.initToggle = this.initToggle.bind(this);
	};

	render (): React.ReactNode {
		const { isEditing, previewId, sectionIds } = this.state;
		const { widgets } = S.Block;
		const { sidebarDirection } = this.props;
		const cnsh = [ 'subHead' ];
		const cnb = [ 'body' ];
		const space = U.Space.getSpaceview();
		const canWrite = U.Space.canMyParticipantWrite();
		const counters = S.Chat.getTotalCounters();
		const cnt = S.Chat.counterString(counters.messageCounter);
		const isDirectionLeft = sidebarDirection == I.SidebarDirection.Left;
		const isDirectionRight = sidebarDirection == I.SidebarDirection.Right;
		const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
		const isMuted = space.notificationMode != I.NotificationMode.All;

		let headerButtons: any[] = [];
		if (space.isChat) {
			headerButtons = headerButtons.concat([
				{ id: 'chat', name: translate('commonChat') },
				{ id: 'mute', name: isMuted ? translate('commonUnmute') : translate('commonMute'), className: isMuted ? 'off' : 'on' },
				{ id: 'settings', name: translate('commonSettings') }
			]);
		};

		if (isEditing) {
			cnb.push('isEditing');
		};

		if (cnt) {
			cnsh.push('withCounter');
		};

		let content = null;
		let first = null;
		let bottom = null;
		let subHead = null;

		if (previewId) {
			const block = S.Block.getLeaf(widgets, previewId);

			if (block) {
				cnb.push('isListPreview');

				const child = this.getChild(block.id);
				const object = this.getObject(block, child?.getTargetObjectId());

				let icon = null;
				let buttons = null;

				if (object.isSystem) {
					icon = <Icon className={object.icon} />;
				} else {
					icon = <IconObject object={object} size={20} iconSize={20} canEdit={false} />;
					buttons = (
						<>
							<Icon className="expand withBackground" onClick={this.onExpand} />
							<Icon id="button-widget-more" className="more withBackground" onClick={this.onMore} />
						</>
					);
				};

				subHead = (
					<div className="subHead">
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
						setEditing={this.setEditing}
						canEdit={true}
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

			subHead = !space.isChat ? (
				<div className={cnsh.join(' ')}>
					{isDirectionLeft || cnt ? (
						<div className="side left" onClick={isDirectionLeft ? this.onBack : null}>
							{isDirectionLeft ? <Icon className="back" /> : ''}
							{cnt ? <div className="cnt">{cnt}</div> : ''}
						</div>
					) : ''}

					<div className="side center">
						<IconObject object={space} size={20} iconSize={20} canEdit={false} />
						<ObjectName object={space} />
					</div>

					<div className="side right">
						{canWrite ? (
							<div className="plusWrapper" onMouseEnter={this.onPlusHover} onMouseLeave={() => Preview.tooltipHide()}>
								<Icon className="create withBackground" onClick={this.onCreate} />
								<Icon id="button-sidebar-select-type" className="arrow withBackground" onClick={this.onArrow} />
							</div>
						) : ''}
					</div>
				</div>
			) : '';

			content = (
				<div className="content">
					{space && !space._empty_ ? (
						<DropTarget 
							{...this.props} 
							isTargetTop={true}
							rootId={S.Block.widgets} 
							id={first?.id}
							dropType={I.DropType.Widget} 
							canDropMiddle={false}
							className="firstTarget"
							cacheKey="firstTarget"
						>
							{isDirectionRight ? (
								<div className="spaceHeader">
									<div className="spaceInfo">
										<IconObject
											id="spaceIcon"
											size={80}
											iconSize={80}
											object={{ ...space, spaceId: S.Common.space }}
										/>
										<ObjectName object={{ ...space, spaceId: S.Common.space }} />
										{members.length > 1 ? <Label className="membersCounter" text={`${members.length} ${U.Common.plural(members.length, translate('pluralMember'))}`} /> : ''}
									</div>
									<div className="buttons">
										{headerButtons.map((item, idx) => (
											<div className="item" onClick={e => this.onButton(e, item)} key={idx}>
												<Icon className={[ item.id, item.className ? item.className : '' ].join(' ')} />
												<Label text={item.name} />
											</div>
										))}
									</div>
								</div>
							) : (
								<Widget
									block={spaceBlock}
									disableContextMenu={true}
									onDragStart={this.onDragStart}
									onDragOver={this.onDragOver}
									onDrag={this.onDrag}
									isEditing={isEditing}
									canEdit={false}
									canRemove={false}
									sidebarDirection={sidebarDirection}
									getObject={id => this.getObject(spaceBlock, id)}
								/>
							)}
						</DropTarget>
					) : ''}

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
												isEditing={isEditing}
												canEdit={true}
												canRemove={isSectionPin}
												onDragStart={this.onDragStart}
												onDragOver={this.onDragOver}
												onDrag={this.onDrag}
												setPreview={this.setPreview}
												setEditing={this.setEditing}
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

			bottom = (
				<div className="bottom">
					<div className="grad" />

					<div className="sides">
						<div className="side left">
							{canWrite ? (
								<div className={[ 'widgetSettings', (isEditing ? 'isEditing' : '') ].join(' ')} onClick={this.onEdit}>
									<Icon tooltipParam={{ text: translate('sidebarEdit') }} />
									<Label text={translate('commonDone')} />
								</div>
							) : ''}
						</div>

						<div className="side center" />

						<div className="side right">
							{!space.isChat ? (
								<Button 
									id="button-help"
									className="help"
									text="?"
									tooltipParam={{ text: translate('commonHelp') }}
									onClick={this.onHelp}
								/>
							) : ''}
						</div>
					</div>
				</div>
			);
		};

		return (
			<>
				<div id="head" className="head">
					{space.isChat ? (
						<>
							<div className="side left">
								<Icon className="search withBackground" onClick={() => keyboard.onSearchPopup(analytics.route.widget)} />
							</div>
							<div className="side right" />
						</>
					) : ''}
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

				{bottom}
			</>
		);
	};

	componentDidMount(): void {
		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	init () {
		S.Block.updateTypeWidgetList();

		const sectionIds = [];
		const ids = [ I.WidgetSection.Pin, I.WidgetSection.Type ];

		ids.forEach(id => {
			if (!this.isSectionClosed(id)) {
				sectionIds.push(id);
			};
		});

		if (!U.Common.objectCompare(sectionIds, this.state.sectionIds)) {
			this.setState({ sectionIds });
		} else {
			ids.forEach(this.initToggle);
		};

		this.onScroll();
	};

	onPlusHover (e: any) {
		const t = Preview.tooltipCaption(translate('commonNew'), [ 
			keyboard.getCaption('createObject'), 
			keyboard.getCaption('selectType'),
		].join(' / '));

		Preview.tooltipShow({ text: t, element: $(e.currentTarget) });
	};

	onCreate = (e: any) => {
		e.stopPropagation();
		keyboard.pageCreate({}, analytics.route.navigation, [ I.ObjectFlag.SelectTemplate, I.ObjectFlag.DeleteEmpty ]);
	};

	onArrow = (e: any) => {
		e.stopPropagation();

		U.Menu.typeSuggest({ 
			element: '#button-sidebar-select-type',
			offsetY: 2,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
		}, {}, { 
			deleteEmpty: true,
			selectTemplate: true,
			withImport: true,
		}, analytics.route.navigation, object => U.Object.openAuto(object));
	};

	onBack = () => {
		sidebar.leftPanelSetState({ page: 'vault' });
	};

	onHelp () {
		const { sidebarDirection } = this.props;

		S.Menu.open('help', {
			element: '#sidebarPageWidget #button-help',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			vertical: I.MenuDirection.Top,
			horizontal: sidebarDirection == I.SidebarDirection.Left ? I.MenuDirection.Left : I.MenuDirection.Right,
			offsetY: -78,
			subIds: J.Menu.help,
		});
	};

	onEdit (e: any): void {
		e.stopPropagation();

		this.setEditing(!this.state.isEditing);
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
		const node = $('#sidebarPageWidget');
		const obj = node.find(`#widget-${block.id}`);
		const clone = $('<div />').addClass('widget isClone').css({ 
			zIndex: 10000, 
			position: 'fixed', 
			left: -10000, 
			top: -10000,
			width: obj.outerWidth(),
		});

		clone.append(obj.find('.head').clone());
		node.append(clone);
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

		scrollOnMove.onMouseDown({ container: node.find('#body') });
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
				const newIndex = items.findIndex(it => it.id == targetId2) + (this.position == I.BlockPosition.Top ? 0 : 1);
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
		const spaceview = U.Space.getSpaceview();
		const { sidebarDirection } = this.props;
		const node = $('#sidebarPageWidget');
		const top = node.find('#body').scrollTop();
		const isScrolled = top > 0;

		let el = null;

		if (sidebarDirection == I.SidebarDirection.Left) {
			el = node.find('.dropTarget.firstTarget');
		} else 
		if (spaceview.isSpace) {
			el = node.find('.subHead');
		} else {
			el = node.find('#head');
		};

		el.toggleClass('isScrolled', isScrolled);
	};

	onArchive (e: any) {
		const { isEditing } = this.state;

		if (!isEditing && !e.button) {
			U.Object.openEvent(e, { layout: I.ObjectLayout.Archive });
		};
	};

	onButton (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();
		const space = U.Space.getSpaceview();
		const isMuted = space.notificationMode != I.NotificationMode.All;

		switch (item.id) {
			case 'chat': {
				U.Object.openAuto({ id: S.Block.workspace, layout: I.ObjectLayout.Chat });
				break;
			};

			case 'add': {
				U.Object.openRoute({ id: 'spaceShare', layout: I.ObjectLayout.Settings });
				analytics.event('ClickSpaceWidgetInvite', { route: analytics.route.widget });
				break;
			};

			case 'mute': {
				C.PushNotificationSetSpaceMode(S.Common.space, Number(isMuted ? I.NotificationMode.All : I.NotificationMode.Mentions));
				break;
			};

			case 'settings': {
				U.Object.openRoute({ id: 'spaceIndex', layout: I.ObjectLayout.Settings });
				break;
			};

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
		const param = U.Data.windgetContentParam(object, block);
		const view = Dataview.getView(rootId, J.Constant.blockId.dataview, param.viewId);

		U.Object.openEvent(e, {
			...object,
			_routeParam_: {
				viewId: view?.id,
				additional: [ { key: 'ref', value: 'widget' } ],
			}
		});
	};

	onMore = (e: any) => {
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
		const param = U.Data.windgetContentParam(object, block);
		const view = Dataview.getView(rootId, J.Constant.blockId.dataview, param.viewId);

		if (!view) {
			return;
		};

		const sort: any = view.sorts.length ? view.sorts[0] : {};

		let isCompact = param.layout == I.WidgetLayout.Compact;
		let relationKey = sort.relationKey;
		let type = sort.type;
		let options = this.getPreviewOptions(isCompact, relationKey, type);
		let menuContext = null;

		S.Menu.open('select', {
			element: '#sidebarPageWidget #button-widget-more',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: context => menuContext = context,
			data: {
				options,
				noClose: true,
				onSelect: (e: any, item: any) => {
					if (item.isLayout) {
						isCompact = item.layout == I.WidgetLayout.Compact;

						switch (block.content.section) {
							case I.WidgetSection.Pin: {
								C.BlockWidgetSetLayout(widgets, block.id, item.layout);
								break;
							};

							case I.WidgetSection.Type: {
								C.ObjectListSetDetails([ targetId ], [ { key: 'widgetLayout', value: item.layout } ]);
								break;
							};
						};
					} else
					if (item.isSort) {
						relationKey = item.relationKey;
						type = item.type;

						sort.relationKey = relationKey;
						sort.type = type;

						C.BlockDataviewSortReplace(targetId, J.Constant.blockId.dataview, view.id, sort.id, { ...sort });
					};

					options = this.getPreviewOptions(isCompact, relationKey, type);
					menuContext.ref.updateOptions(options);
				},
			}
		});
	};

	getPreviewOptions = (isCompact: boolean, relationKey: string, sortType: I.SortType) => {
		const options: any[] = [
			{ isSection: true, name: translate('commonAppearance') },
			{ isLayout: true, layout: I.WidgetLayout.List, checkbox: !isCompact, name: translate('widget2Name') },
			{ isLayout: true, layout: I.WidgetLayout.Compact, checkbox: isCompact, name: translate('widget3Name') },
			{ isDiv: true },
			{ isSection: true, name: translate('sidebarObjectSort') },
			{ isSort: true, name: translate('sidebarObjectSortUpdated'), type: I.SortType.Asc, relationKey: 'lastModifiedDate', defaultType: I.SortType.Desc },
			{ isSort: true, name: translate('sidebarObjectSortCreated'), type: I.SortType.Asc, relationKey: 'createdDate', defaultType: I.SortType.Desc },
			{ isSort: true, name: translate('commonName'), type: I.SortType.Asc, relationKey: 'name', defaultType: I.SortType.Asc },
		];

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
		const obj = $(`#sidebarPageWidget`);
		const section = obj.find(`#section-${id}`);
		const list = section.find('> .items');
		const isClosed = this.isSectionClosed(id);

		section.toggleClass('isOpen', !isClosed);
		list.toggleClass('isOpen', !isClosed).css({ height: (!isClosed ? 'auto': 0) });
	};

	onToggle = (id: I.WidgetSection) => {
		const obj = $(`#sidebarPageWidget`);
		const section = obj.find(`#section-${id}`);
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
		const node = $('#sidebarPageWidget');

		node.find('.widget.isOver').removeClass('isOver top bottom');
		node.find('.widget.isClone').remove();

		this.dropTargetId = '';
		this.position = null;

		raf.cancel(this.frame);
	};

	setPreview (previewId: string) {
		this.setState({ previewId });
	};

	setEditing (isEditing: boolean) {
		this.setState({ isEditing });

		if (!isEditing) {
			return;
		};

		const win = $(window);
		const unbind = () => win.off('mousedown.sidebar keydown.sidebar');
		const close = e => {
			e.stopPropagation();

			this.setEditing(false);
			unbind();
		};

		unbind();
		analytics.event('EditWidget');

		window.setTimeout(() => {
			win.on('mousedown.sidebar', e => {
				if (!$(e.target).parents('.widget, .bottom, .nameWrap').length) {
					close(e);
				};
			});

			win.on('keydown.sidebar', e => {
				keyboard.shortcut('escape', e, () => close(e));
			});
		}, S.Menu.getTimeout());
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

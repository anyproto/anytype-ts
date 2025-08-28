import * as React from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { Button, Icon, Widget, DropTarget, ProgressText, Label, IconObject, ObjectName } from 'Component';
import { I, C, M, S, U, J, keyboard, analytics, translate, scrollOnMove, Preview, sidebar } from 'Lib';

type State = {
	isEditing: boolean;
	previewId: string;
};

const SidebarPageWidget = observer(class SidebarPageWidget extends React.Component<I.SidebarPageComponent, State> {
		
	state: State = {
		isEditing: false,
		previewId: '',
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
		this.onAdd = this.onAdd.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.setEditing = this.setEditing.bind(this);
		this.setPreview = this.setPreview.bind(this);
		this.onHelp = this.onHelp.bind(this);
		this.onPlusHover = this.onPlusHover.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onArrow = this.onArrow.bind(this);
		this.onBack = this.onBack.bind(this);
	};

	render (): React.ReactNode {
		const { isEditing, previewId } = this.state;
		const { widgets } = S.Block;
		const { sidebarDirection, isPopup, page } = this.props;
		const cnsh = [ 'subHead' ];
		const cnb = [ 'body' ];
		const space = U.Space.getSpaceview();
		const canWrite = U.Space.canMyParticipantWrite();
		const buttons: I.ButtonComponent[] = [];
		const counters = S.Chat.getTotalCounters();
		const cnt = S.Chat.counterString(counters.messageCounter);
		const isDirectionLeft = sidebarDirection == I.SidebarDirection.Left;
		const isDirectionRight = sidebarDirection == I.SidebarDirection.Right;
		const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
		const isMuted = space.notificationMode != I.NotificationMode.All;
		const chatSpaceHeaderButtons = [
			{ id: 'chat', name: translate('commonChat') },
			{ id: 'add', name: translate('commonAdd') },
			{ id: 'mute', name: isMuted ? translate('commonUnmute') : translate('commonMute'), className: isMuted ? 'off' : 'on' },
		];

		if (isEditing) {
			cnb.push('isEditing');
		};

		if (cnt) {
			cnsh.push('withCounter');
		};

		let content = null;
		let first = null;
		let bottom = null;

		if (previewId) {
			const block = S.Block.getLeaf(widgets, previewId);

			if (block) {
				cnb.push('isListPreview');
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
					/>
				);
			};
		} else {
			const blocks = S.Block.getChildren(widgets, widgets, (block: I.Block) => {
				if (!block.isWidget()) {
					return false;
				};

				const childrenIds = S.Block.getChildrenIds(widgets, block.id);
				if (!childrenIds.length) {
					return false;
				};

				const child = S.Block.getLeaf(widgets, childrenIds[0]);
				if (!child) {
					return false;
				};

				const target = child.getTargetObjectId();

				if (Object.values(J.Constant.widgetId).includes(target)) {
					return true;
				};

				const object = S.Detail.get(widgets, target, [ 'isArchived', 'isDeleted' ], true);
				if (object._empty_ || object.isArchived || object.isDeleted) {
					return false;
				};

				return true;
			}).sort((a: I.Block, b: I.Block) => {
				const c1 = this.getChild(a.id);
				const c2 = this.getChild(b.id);

				const t1 = c1?.getTargetObjectId();
				const t2 = c2?.getTargetObjectId();

				const isChat1 = t1 == J.Constant.widgetId.chat;
				const isChat2 = t2 == J.Constant.widgetId.chat;

				const isBin1 = t1 == J.Constant.widgetId.bin;
				const isBin2 = t2 == J.Constant.widgetId.bin;

				if (isChat1 && !isChat2) return -1;
				if (!isChat1 && isChat2) return 1;

				if (isBin1 && !isBin2) return 1;
				if (!isBin1 && isBin2) return -1;

				return 0;
			});

			if (blocks.length) {
				first = blocks[0];
			};

			if (isEditing) {
				if (blocks.length <= J.Constant.limit.widgets) {
					buttons.push({ id: 'widget-list-add', className: 'grey c28', text: translate('commonAdd'), onMouseDown: e => this.onAdd(e, analytics.route.addWidgetEditor) });
				};

				buttons.push({ id: 'widget-list-done', className: 'grey c28', text: translate('commonDone'), onMouseDown: this.onEdit });
			};

			content = (
				<div className="content">
					{blocks.map((block, i) => {
						const { widgets } = S.Block;
						const childrenIds = S.Block.getChildrenIds(widgets, block.id);
						const child = childrenIds.length ? S.Block.getLeaf(widgets, childrenIds[0]) : null;
						const targetId = child ? child.getTargetObjectId() : '';
						const isChat = targetId == J.Constant.widgetId.chat;
						const canEdit = !isChat || !space.isChat;

						return (
							<Widget
								{...this.props}
								key={`widget-${block.id}`}
								block={block}
								isEditing={canEdit ? isEditing : false}
								canEdit={canEdit}
								canRemove={canEdit}
								onDragStart={this.onDragStart}
								onDragOver={this.onDragOver}
								onDrag={this.onDrag}
								setPreview={this.setPreview}
								setEditing={this.setEditing}
								sidebarDirection={sidebarDirection}
							/>
						);
					})}
				</div>
			);

			bottom = isDirectionRight ? '' : (
				<div className="bottom">
					<div className="grad" />

					<div className="sides">
						<div className="side left">
							<div className={[ 'widgetSettings', (isEditing ? 'isEditing' : '') ].join(' ')} onClick={this.onEdit}>
								<Icon tooltipParam={{ text: translate('sidebarEdit') }} />
								<Label text={translate('commonDone')} />
							</div>
						</div>

						<div className="side center">
							<Button 
								id="widget-list-add"
								text={translate('menuWidgetAddWidget')}
								onClick={this.onAdd}
							/>
						</div>

						<div className="side right">
							<Button 
								id="button-widget-help"
								className="help"
								text="?"
								tooltipParam={{ text: translate('commonHelp') }}
								onClick={this.onHelp}
							/>
						</div>
					</div>
				</div>
			);
		};

		let bodyHead = null;
		if (space && !space._empty_) {
			bodyHead = (
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
								{chatSpaceHeaderButtons.map((item, idx) => (
									<div className="item" onClick={e => this.onChatSpaceButton(e, item)} key={idx}>
										<Icon className={[ item.id, item.className ? item.className : '' ].join(' ')} />
										<Label text={item.name} />
									</div>
								))}
							</div>
						</div>
					) : (
						<Widget
							block={new M.Block({ id: 'space', type: I.BlockType.Widget, content: { layout: I.WidgetLayout.Space } })}
							disableContextMenu={true}
							onDragStart={this.onDragStart}
							onDragOver={this.onDragOver}
							onDrag={this.onDrag}
							isEditing={isEditing}
							canEdit={false}
							canRemove={false}
							sidebarDirection={sidebarDirection}
						/>
					)}
				</DropTarget>
			);
		};

		return (
			<>
				<div className="head">
					{isDirectionLeft ? (
						<ProgressText label={translate('progressUpdateDownloading')} type={I.ProgressType.Update} />
					) : (
						<>
							<div className="side left">
								<Icon className="search withBackground" onClick={() => keyboard.onSearchPopup(analytics.route.widget)} />
							</div>
							<div className="side right">
								<Icon className="settings withBackground" onClick={() => U.Object.openRoute({ id: 'spaceIndex', layout: I.ObjectLayout.Settings })} />
							</div>
						</>
					)}
				</div>

				{isDirectionLeft ? (
					<div className={cnsh.join(' ')}>
						<div className="side left">
							<Icon className="back" onClick={this.onBack} />
							{cnt ? <div className="cnt">{cnt}</div> : ''}
						</div>

						<div className="side center">
							<IconObject object={space} size={20} iconSize={20} canEdit={false} />
							<ObjectName object={space} />
						</div>

						<div className="side right">
							{canWrite ? (
								<div className="plusWrapper" onMouseEnter={this.onPlusHover} onMouseLeave={() => Preview.tooltipHide()}>
									<Icon className="plus withBackground" onClick={this.onCreate} />
									<Icon id="button-sidebar-select-type" className="arrow withBackground" onClick={this.onArrow} />
								</div>
							) : ''}
						</div>
					</div>
				) : ''}

				{bodyHead}

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

	componentDidUpdate (): void {
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
		}, analytics.route.widget, object => U.Object.openAuto(object));
	};

	onBack = () => {
		sidebar.leftPanelSetState({ page: 'vault' });
	};

	onHelp () {
		S.Menu.open('help', {
			element: '#button-widget-help',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			vertical: I.MenuDirection.Top,
			offsetY: -78,
			subIds: J.Menu.help,
		});
	};

	onEdit (e: any): void {
		e.stopPropagation();

		this.setEditing(!this.state.isEditing);
	};

	onAdd (e: any, route?: string): void {
		e.stopPropagation();

		analytics.event('ClickAddWidget', { route });

		const { isEditing } = this.state;
		const { widgets } = S.Block;
		const space = U.Space.getSpaceview();
		const blocks = S.Block.getChildren(widgets, widgets, (block: I.Block) => block.isWidget());
		const targets = [];
		const node = $('#sidebarPageWidget');
		const nh = node.outerHeight();
		const button = node.find('#widget-list-add');
		const { top } = button.offset();
		const position = top + 350 > nh ? I.MenuDirection.Top : I.MenuDirection.Bottom;

		if (isEditing) {
			this.onEdit(e);
		};

		blocks.forEach(block => {
			const children = S.Block.getChildren(widgets, block.id);
			if (children.length) {
				targets.push(children[0].getTargetObjectId());
			};
		});

		const onSelect = (target: any, isNew: boolean) => {
			if (!target) {
				return;
			};

			const limitOptions = U.Menu.getWidgetLimitOptions(I.WidgetLayout.Link);
			const layoutOptions = U.Menu.getWidgetLayoutOptions(target.id, target.layout);
			const layout = layoutOptions.length ? layoutOptions[0].id : I.WidgetLayout.Link;
			const newBlock = { 
				type: I.BlockType.Link,
				content: { 
					targetBlockId: target.id, 
				},
			};

			C.BlockCreateWidget(S.Block.widgets, '', newBlock, I.BlockPosition.Top, layout, Number(limitOptions[0].id), (message: any) => {
				if (message.error.code) {
					return;
				};

				if (isNew) {
					U.Object.openConfig(target);
				};

				analytics.createWidget(I.WidgetLayout.Link, route, analytics.widgetType.manual);
				analytics.event('ChangeWidgetSource', {
					layout,
					route: analytics.route.addWidget,
					params: { target },
				});
			});					
		};

		let menuContext = null;

		S.Menu.open('searchObjectWidgetAdd', {
			component: 'searchObject',
			element: '#widget-list-add',
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			offsetY: position == I.MenuDirection.Top ? -4 : 4,
			horizontal: I.MenuDirection.Center,
			vertical: position,
			subIds: J.Menu.widgetAdd,
			onOpen: context => menuContext = context,
			data: {
				route: analytics.route.addWidget,
				withPlural: true,
				filters: [
					{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts() },
					{ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
				],
				canAdd: true,
				addParam: {
					name: translate('commonCreateNewObject'),
					nameWithFilter: translate('commonCreateObjectWithName'),
					arrow: true,
					onClick: (details: any) => {
						const types = U.Data.getObjectTypesForNewObject({ withCollection: true, withSet: true, limit: 1 });

						if (!types.length) {
							return;
						};

						C.ObjectCreate(details, [], '', types[0].uniqueKey, S.Common.space, (message: any) => {
							onSelect(message.details, true);
						});
					},
				},
				onOver: (e, context: any, item: any) => {
					if (!item.isAdd) {
						S.Menu.closeAll(J.Menu.widgetAdd);
						return;
					};

					U.Menu.typeSuggest({ 
						element: `#${menuContext.getId()} #item-${item.id}`,
						className: 'fixed',
						classNameWrap: 'fromSidebar',
						offsetX: menuContext.getSize().width,
						vertical: I.MenuDirection.Center,
						isSub: true,
						data: {
							onAdd: () => menuContext?.close(),
						},
					}, { name: context.filter }, {}, analytics.route.addWidget, object => {
						onSelect(object, true);
						menuContext?.close();
					});
				},
				dataChange: (context: any, items: any[]) => {
					const skipLayouts = U.Object.getSystemLayouts().concat(I.ObjectLayout.Type);
					const reg = new RegExp(U.Common.regexEscape(context.filter), 'gi');
					const types = S.Record.checkHiddenObjects(S.Record.getTypes()).
						filter(it => {
							const name = String(it.name || it.pluralName || '');

							return !targets.includes(it.id) && 
								!skipLayouts.includes(it.recommendedLayout) && 
								!U.Object.isTemplateType(it.id) && 
								name.match(reg);
						}).
						map(it => ({ ...it, caption: '' }));
					const lists = [];

					let system: any[] = U.Menu.getSystemWidgets().filter(it => !targets.includes(it.id) && it.name.match(reg));

					if (system.length) {
						system = system.filter(it => it.id != J.Constant.widgetId.allObject);

						if (!space.isChat || (!space.chatId && !U.Object.isAllowedChat(true))) {
							system = system.filter(it => it.id != J.Constant.widgetId.chat);
						};

						lists.push([ { name: translate('commonSystem'), isSection: true } ].concat(system));
					};

					if (types.length) {
						lists.push([ { name: translate('commonSuggested'), isSection: true } ].concat(types));
					};

					if (items.length) {
						lists.push([ { name: translate('commonExistingObjects'), isSection: true } ].concat(items));
					};

					let ret = [];
					for (let i = 0; i < lists.length; ++i) {
						if (i > 0) {
							ret = ret.concat({ isDiv: true });
						};
						ret = ret.concat(lists[i]);
					};

					return ret;
				},
				onSelect,
			},
		});
	};

	onDragStart (e: React.DragEvent, blockId: string): void {
		e.stopPropagation();

		const canWrite = U.Space.canMyParticipantWrite();
		if (!canWrite) {
			return;
		};

		const child = this.getChild(blockId);
		if (!child) {
			return;
		};

		const targetId = child.getTargetObjectId();

		if ([ J.Constant.widgetId.chat, J.Constant.widgetId.bin ].includes(targetId)) {
			e.preventDefault();
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const win = $(window);
		const node = $('#sidebarPageWidget');
		const obj = node.find(`#widget-${blockId}`);
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
		e.dataTransfer.setData('text', blockId);

		win.off('dragend.widget').on('dragend.widget', () => {
			this.onDragEnd();
			win.off('dragend.widget');
		});

		scrollOnMove.onMouseDown({ isWindow: false, container: node.find('#body') });
	};

	onDrag (e: React.DragEvent, blockId: string): void {
		scrollOnMove.onMouseMove(e.clientX, e.clientY);	
	};

	onDragOver (e: React.DragEvent, blockId: string) {
		if (!this.isDragging) {
			return;
		};

		e.preventDefault();

		const target = $(e.currentTarget);
		const y = e.pageY;

		raf.cancel(this.frame);
		this.frame = raf(() => {
			this.clear();
			this.dropTargetId = blockId;

			const { top } = target.offset();
			const height = target.height();
			const child = this.getChild(blockId);

			this.position = y <= top + height / 2 ? I.BlockPosition.Top : I.BlockPosition.Bottom;

			if (child) {
				const t = child.getTargetObjectId();
				if (t == J.Constant.widgetId.chat) {
					this.position = I.BlockPosition.Bottom;
				};
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

		const { widgets } = S.Block;
		const blockId = e.dataTransfer.getData('text');

		if (blockId != this.dropTargetId) {
			C.BlockListMoveToExistingObject(widgets, widgets, this.dropTargetId, [ blockId ], this.position);
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
		const node = $('#sidebarPageWidget');
		const top = node.find('#body').scrollTop();

		node.find('.dropTarget.firstTarget').toggleClass('isScrolled', top > 0);
	};

	onArchive (e: any) {
		const { isEditing } = this.state;

		if (!isEditing && !e.button) {
			U.Object.openEvent(e, { layout: I.ObjectLayout.Archive });
		};
	};

	onChatSpaceButton (e: any, item: any) {
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
				if (!$(e.target).parents('.widget, .bottom').length) {
					close(e);
				};
			});

			win.on('keydown.sidebar', e => {
				keyboard.shortcut('escape', e, () => close(e));
			});
		}, S.Menu.getTimeout());
	};

	getChild (id: string): I.Block {
		const { widgets } = S.Block;

		const childrenIds = S.Block.getChildrenIds(widgets, id);
		if (!childrenIds.length) {
			return null;
		};

		return S.Block.getLeaf(widgets, childrenIds[0]);
	};

});

export default SidebarPageWidget;

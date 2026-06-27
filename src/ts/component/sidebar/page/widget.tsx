import React, { forwardRef, useRef, useEffect, useLayoutEffect, useState, useCallback, DragEvent } from 'react';
import raf from 'raf';
import { reaction } from 'mobx';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Icon, Widget, WidgetHome, ObjectName, Label, SpaceName, Sync } from 'Component';
import { I, C, M, S, U, J, keyboard, analytics, translate, scrollOnMove, Storage, Dataview, sidebar, Action } from 'Lib';

const SidebarPageWidget = forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const [ previewId, setPreviewId ] = useState('');
	const [ , setDummy ] = useState(0);
	const forceUpdate = () => setDummy(v => v + 1);
	const { widgets } = S.Block;
	const childrenIdsWidget = S.Block.getChildrenIds(widgets, widgets);
	const lengthWidget = childrenIdsWidget.length;
	const { sidebarDirection, isPopup, getId } = props;
	const { space, widgetSections, recentEditMode, sidebarView } = S.Common;
	const isLinksView = sidebarView == I.SidebarView.Links;
	const cnb = [ 'body' ];
	const spaceview = U.Space.getSpaceview();
	const canWrite = U.Space.canMyParticipantWrite();
	const canModerate = U.Space.canMyParticipantModerate();
	const bodyRef = useRef<HTMLDivElement>(null);
	const dropTargetIdRef = useRef<string>('');
	const positionRef = useRef<I.BlockPosition>(null);
	const isDraggingRef = useRef<boolean>(false);
	const frameRef = useRef<number>(0);
	const dragEndHandlerRef = useRef<(() => void) | null>(null);
	const syntheticBlockCacheRef = useRef<Map<string, I.Block>>(new Map());

	if (isLinksView) {
		cnb.push('isLinksView');
	};

	let content = null;
	let head = null;

	const getSections = () => {
		const types = U.Data.getWidgetTypes();
		const sections = U.Menu.widgetSections();
		const pinned = U.Data.getWidgetObjects(widgets, false);
		const personal = U.Data.getWidgetObjects(U.Object.getPersonalWidgetsId(), false);
		const recent = S.Record.getRecords(U.Subscription.getRecentSubId());
		const { total } = S.Record.getMeta(U.Subscription.spaceSubId(J.Constant.subId.archived), '');
		const ret = [] as I.WidgetSection[];

		if (!spaceview.isOneToOne) {
			const chats = U.Data.getWidgetChats();
			if (chats.length) {
				ret.push(I.WidgetSection.Unread);
			};
		};

		if (pinned.length) {
			ret.push(I.WidgetSection.Pin);
		};

		if (personal.length) {
			ret.push(I.WidgetSection.MyFavorites);
		};

		if (recent.length) {
			ret.push(I.WidgetSection.RecentEdit);
		};

		if (types.length) {
			ret.push(I.WidgetSection.Type);
		};

		if (total > 0) {
			ret.push(I.WidgetSection.Bin);
		};

		return sections.filter(it => ret.includes(it.id));
	};

	const initSections = () => {
		S.Common.widgetSectionsInit();
		getSections().map(it => it.id).forEach(initToggle);
	};

	const initScroll = () => {
		const body = bodyRef.current;
		const top = Storage.getScroll('sidebarWidget', '', isPopup);

		if (body) {
			body.scrollTop = top;
		};
	};

	const onDragStart = (e: DragEvent, block: I.Block): void => {
		e.stopPropagation();

		const canWrite = U.Space.canMyParticipantWrite();
		if (!canWrite) {
			return;
		};

		const child = getChild(block.id);
		if (!child) {
			return;
		};

		const targetId = child.getTargetObjectId();

		if ([ J.Constant.widgetId.bin ].includes(targetId)) {
			e.preventDefault();
			return;
		};

		const selection = S.Common.getRef('selectionProvider');
		const body = bodyRef.current;

		if (!body) {
			return;
		};

		const obj = U.Dom.select(`#widget-${U.Common.esc(block.id)}`, body);
		const clone = document.createElement('div');

		clone.className = 'widget isClone';
		U.Dom.css(clone, { 
			zIndex: '10000', 
			position: 'fixed', 
			left: '-10000px', 
			top: '-10000px', 
			width: `${obj?.offsetWidth ?? 0}px`,
		});

		const headEl = obj ? U.Dom.select('.head', obj) : null;
		if (headEl) {
			clone.appendChild(headEl.cloneNode(true));
		};

		body.appendChild(clone);
		selection?.clear();
		U.Dom.addClass(document.body, 'isDragging');

		keyboard.disableCommonDrop(true);
		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		isDraggingRef.current = true;

		e.dataTransfer.setDragImage(clone, 0, 0);
		e.dataTransfer.setData('text', JSON.stringify({ blockId: block.id, section: block.content.section }));

		if (dragEndHandlerRef.current) {
			U.Dom.removeEvent(window, 'dragend', dragEndHandlerRef.current);
		};

		const dragEndHandler = () => {
			onDragEnd();
			if (dragEndHandlerRef.current) {
				U.Dom.removeEvent(window, 'dragend', dragEndHandlerRef.current);
				dragEndHandlerRef.current = null;
			};
		};
		dragEndHandlerRef.current = dragEndHandler;
		U.Dom.addEvent(window, 'dragend', dragEndHandler);

		scrollOnMove.onMouseDown({ container: body, speed: 300, step: 1 });
	};

	const onDrag = (e: DragEvent, block: I.Block): void => {
		scrollOnMove.onMouseMove(e.clientX, e.clientY);
	};

	const onDragOver = (e: DragEvent, block: I.Block) => {
		if (!isDraggingRef.current) {
			return;
		};

		e.preventDefault();

		const target = e.currentTarget as HTMLElement;
		const y = e.pageY;

		raf.cancel(frameRef.current);
		frameRef.current = raf(() => {
			clear();
			dropTargetIdRef.current = block.id;

			const rect = target.getBoundingClientRect();
			const top = rect.top + window.scrollY;
			const height = U.Dom.contentHeight(target);
			const child = getChild(block.id);

			positionRef.current = y <= top + height / 2 ? I.BlockPosition.Top : I.BlockPosition.Bottom;

			if (child) {
				const t = child.getTargetObjectId();
				if (t == J.Constant.widgetId.bin) {
					positionRef.current = I.BlockPosition.Top;
				};
			};

			U.Dom.addClass(target, `isOver ${positionRef.current == I.BlockPosition.Top ? 'top' : 'bottom'}`);
		});
	};

	/*
	 * Stable identities for the drag handlers passed to each <Widget>. The handlers
	 * themselves are recreated every render; without these wrappers a re-render of
	 * this page (e.g. chat counters churning on a reaction toggle) would hand every
	 * widget new function props, breaking their observer/memo and re-rendering
	 * unrelated widgets like "Last edited". The ref always points at the latest
	 * handler, so behavior is unchanged.
	 */
	const dragHandlersRef = useRef({ onDragStart, onDragOver, onDrag });
	dragHandlersRef.current = { onDragStart, onDragOver, onDrag };

	const onDragStartStable = useCallback((e: DragEvent, block: I.Block) => dragHandlersRef.current.onDragStart(e, block), []);
	const onDragOverStable = useCallback((e: DragEvent, block: I.Block) => dragHandlersRef.current.onDragOver(e, block), []);
	const onDragStable = useCallback((e: DragEvent, block: I.Block) => dragHandlersRef.current.onDrag(e, block), []);

	const onDrop = (e: DragEvent): void => {
		if (!isDraggingRef.current) {
			return;
		};

		e.stopPropagation();

		let data: any = {};
		try {
			data = JSON.parse(e.dataTransfer.getData('text'));
		} catch (err) {
			return;
		};

		const { blockId, section } = data;

		if (blockId == dropTargetIdRef.current) {
			onDragEnd();
			return;
		};

		switch (section) {
			case I.WidgetSection.Pin: {
				C.BlockListMoveToExistingObject(widgets, widgets, dropTargetIdRef.current, [ blockId ], positionRef.current);
				break;
			};
		};

		onDragEnd();
	};

	const onDragEnd = () => {
		keyboard.disableCommonDrop(false);
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		isDraggingRef.current = false;
		clear();

		U.Dom.removeClass(document.body, 'isDragging');
	};

	const onScroll = () => {
		const top = bodyRef.current?.scrollTop ?? 0;

		if (!previewId) {
			Storage.setScroll('sidebarWidget', '', top, isPopup);
		};

		U.Dom.toggleClass(U.Dom.get(getId()), 'isScrolled', top > 0);
	};

	const onTypeCreate = () => {
		U.Object.createType({}, false);
	};

	const onExpand = (e: any) => {
		const block = S.Block.getLeaf(widgets, previewId);

		if (!block) {
			return;
		};

		const child = getChild(block.id);
		const targetId = child?.getTargetObjectId();
		const rootId = getChildRootId(targetId, child.id);
		const object = getObject(block, targetId);
		const param = U.Data.widgetContentParam(object, block);
		const view = Dataview.getView(rootId, J.Constant.blockId.dataview, param.viewId);

		S.Common.routeParam = { ref: 'widget', viewId: view?.id };
		U.Object.openConfig(e, object);
	};

	const onMore = (e: any) => {
		e.stopPropagation();

		const block = S.Block.getLeaf(widgets, previewId);

		if (!block) {
			return;
		};

		const child = getChild(block.id);
		const targetId = child?.getTargetObjectId();
		const object = getObject(block, targetId);
		const rootId = getChildRootId(targetId, child.id);
		const param = U.Data.widgetContentParam(object, block);
		const view = Dataview.getView(rootId, J.Constant.blockId.dataview, param.viewId);

		if (!view) {
			return;
		};

		const sorts = Dataview.getFilteredSorts(view.sorts);
		const sort: any = sorts.length ? sorts[0] : {};

		let relationKey = sort.relationKey;
		let type = sort.type;
		let menuContext = null;

		S.Menu.open('select', {
			element: `#button-widget-more`,
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: context => menuContext = context,
			data: {
				options: getPreviewOptions(param, relationKey, type),
				noClose: true,
				onSelect: (e: any, item: any) => {
					const cb = () => {
						S.Block.updateWidgetData(targetId);
						menuContext?.close();
					};

					if (item.isLayout) {
						switch (block.content.section) {
							case I.WidgetSection.Pin: {
								C.BlockWidgetSetLayout(widgets, block.id, item.layout, cb);
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

	const getPreviewOptions = (param: any, relationKey: string, sortType: I.SortType) => {
		const block = S.Block.getLeaf(widgets, previewId);
		const child = getChild(block.id);
		const object = getObject(block, child?.getTargetObjectId());
		const layoutOptions = U.Menu.getWidgetLayoutOptions(object?.id, object?.layout, true);
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

	const isSectionClosed = (id: I.WidgetSection) => {
		if ([ I.WidgetSection.Pin, I.WidgetSection.Bin ].includes(id)) {
			return false;
		};

		return widgetSections.find(it => it.id == id)?.isClosed;
	};

	const initToggle = (id: I.WidgetSection) => {
		const body = bodyRef.current;
		if (!body) {
			return;
		};

		const section = U.Dom.select(`#section-${U.Common.esc(id)}`, body);
		if (!section) {
			return;
		};

		const list = U.Dom.select(':scope > .items', section);
		const isClosed = isSectionClosed(id);

		U.Dom.toggleClass(section, 'isOpen', !isClosed);
		if (list) {
			U.Dom.toggleClass(list, 'isOpen', !isClosed);
			U.Dom.css(list, { height: isClosed ? '0' : 'auto', overflow: isClosed ? 'hidden' : 'visible' });
		};
	};

	const onToggle = (id: I.WidgetSection) => {
		const body = bodyRef.current;
		if (!body) {
			return;
		};

		const element = U.Dom.select(`#section-${U.Common.esc(id)}`, body);
		if (!element) {
			return;
		};

		const list = U.Dom.select(':scope > .items', element);
		const sections = U.Common.objectCopy(widgetSections);
		const idx = sections.findIndex(it => it.id == id);
		const isClosed = sections[idx].isClosed;

		sections[idx].isClosed = !isClosed;
		U.Dom.toggleClass(element, 'isOpen', isClosed);

		if (isClosed) {
			S.Common.widgetSectionsSet(sections);
			U.Dom.toggle(list, 200, false);
		} else {
			U.Dom.toggle(list, 200, true, () => {
				S.Common.widgetSectionsSet(sections);
			});
		};
	};

	const onSync = () => {
		S.Menu.closeAllForced(null, () => {
			S.Menu.open('syncStatus', {
				element: `#${getId()} #headerSync`,
				offsetY: 4,
				classNameWrap: 'fixed fromSidebar',
				subIds: J.Menu.syncStatus,
			});
		});
	};

	const onSectionContext = (sectionId: I.WidgetSection) => {
		if (sectionId == I.WidgetSection.Unread) {
			return;
		};

		const section = `#${getId()} #section-${U.Common.esc(sectionId)}`;
		const wrap = `${section} .nameWrap`;
		const element = `${section} .buttons`;

		U.Menu.widgetSectionContext(sectionId, {
			element,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			onOpen: () => {
				const el = U.Dom.select(wrap);
				U.Dom.addClass(el, 'active');
			},
			onClose: () => {
				const el = U.Dom.select(wrap);
				U.Dom.removeClass(el, 'active');
			},
		});
	};

	const clear = () => {
		const body = bodyRef.current;
		if (body) {
			U.Dom.selectAll('.widget.isOver', body).forEach(el => U.Dom.removeClass(el, 'isOver top bottom'));
			U.Dom.selectAll('.widget.isClone', body).forEach(el => el.remove());
		};

		dropTargetIdRef.current = '';
		positionRef.current = null;

		raf.cancel(frameRef.current);
	};

	/*
	 * System sections (Unread/Type/RecentEdit/Bin/personalWidgets/pinned-links) have
	 * no stored widget block, so one is synthesized. Cache by id so the <Widget>
	 * `block` prop keeps a stable reference across re-renders — otherwise the child
	 * observer/memo always breaks and the widget re-renders on every parent render
	 * (e.g. chat-counter churn). Cleared on space change.
	 */
	const getSyntheticWidgetBlock = (id: string): I.Block => {
		const cache = syntheticBlockCacheRef.current;

		if (!cache.has(id)) {
			cache.set(id, new M.Block({
				id,
				type: I.BlockType.Widget,
				content: { layout: I.WidgetLayout.Object },
			}));
		};

		return cache.get(id);
	};

	const getWidgets = (sectionId: I.WidgetSection) => {
		if ((sectionId == I.WidgetSection.Pin) && isLinksView) {
			return [
				getSyntheticWidgetBlock([ space, J.Constant.widgetId.pinned ].join('-')),
			];
		};

		let blocks = [];

		switch (sectionId) {
			case I.WidgetSection.Unread:
			case I.WidgetSection.Type:
			case I.WidgetSection.RecentEdit:
			case I.WidgetSection.Bin: {
				const idMap = {
					[I.WidgetSection.Unread]: J.Constant.widgetId.unread,
					[I.WidgetSection.Type]: J.Constant.widgetId.type,
					[I.WidgetSection.RecentEdit]: J.Constant.widgetId.recentEdit,
					[I.WidgetSection.Bin]: J.Constant.widgetId.bin,
				};

				blocks.push(getSyntheticWidgetBlock([ space, idMap[sectionId] ].join('-')));
				break;
			};

			case I.WidgetSection.MyFavorites: {
				const ws = widgetSections.find(it => it.id == I.WidgetSection.MyFavorites);

				if ((ws?.view == 'widgets') && !isLinksView) {
					const personalRootId = U.Object.getPersonalWidgetsId();
					blocks = S.Block.getChildren(personalRootId, personalRootId, (block: I.Block) => {
						if (!block.isWidget()) {
							return false;
						};

						const innerIds = S.Block.getChildrenIds(personalRootId, block.id);
						if (!innerIds.length) {
							return false;
						};

						const inner = S.Block.getLeaf(personalRootId, innerIds[0]);
						const targetId = inner?.getTargetObjectId();
						if (!targetId) {
							return false;
						};

						// Allow not-yet-loaded objects (_empty_) so the section doesn't vanish on cold render,
						// but hide ones that have resolved as archived or deleted.
						const object = S.Detail.get(personalRootId, targetId);
						if (object && !object._empty_ && (object.isArchived || object.isDeleted)) {
							return false;
						};

						return true;
					});
				} else {
					blocks.push(getSyntheticWidgetBlock([ space, J.Constant.widgetId.personalWidgets ].join('-')));
				};
				break;
			};

			case I.WidgetSection.Pin: {
				blocks = S.Block.getChildren(widgets, widgets, (block: I.Block) => {
					if (!block.isWidget()) {
						return false;
					};

					const child = getChild(block.id);
					if (!child) {
						return false;
					};

					const target = child.getTargetObjectId();

					if ([ J.Constant.widgetId.allObject, J.Constant.widgetId.chat, J.Constant.widgetId.bin ].includes(target)) {
						return false;
					};

					if (Object.values(J.Constant.widgetId).includes(target)) {
						return true;
					};

					const object = getObject(block, target);

					if (!object || object._empty_ || object.isArchived || object.isDeleted) {
						return false;
					};

					return true;
				});
				break;
			};
		};

		return blocks;
	};

	const getChild = (id: string): I.Block => {
		const childrenIds = S.Block.getChildrenIds(widgets, id);

		if (!childrenIds.length) {
			return null;
		};

		return S.Block.getLeaf(widgets, childrenIds[0]);
	};

	const getChildRootId = (targetId: string, blockId: string): string => {
		return [ targetId, 'widget', blockId ].join('-');
	};

	const getObject = (block: I.Block, id: string) => {
		if (!id) {
			return null;
		};

		let object = null;
		if (U.Menu.isSystemWidget(id)) {
			object = U.Menu.getSystemWidgets().find(it => it.id == id);
		} else
		if (block.content.section == I.WidgetSection.Type) {
			object = S.Detail.get(U.Subscription.spaceSubId(J.Constant.subId.type), id);
		} else {
			object = S.Detail.get(widgets, id);
		};
		return object;
	};

	/*
	 * Returns a getObject callback with a stable identity per (widget block, isFavorites),
	 * so passing it to <Widget> doesn't break the child's observer/memo on unrelated
	 * re-renders. getObjectRef always points at the latest helper; the cached closures
	 * only capture stable values, so behavior is unchanged.
	 */
	const getObjectRef = useRef(getObject);
	getObjectRef.current = getObject;
	const getObjectCacheRef = useRef<Map<string, (id: string) => any>>(new Map());

	const getWidgetGetObject = (block: I.Block, isFav: boolean, favRootId: string) => {
		const key = `${block.id}:${isFav ? 1 : 0}`;
		const cache = getObjectCacheRef.current;

		if (!cache.has(key)) {
			cache.set(key, (id: string) => {
				if (isFav) {
					if (U.Menu.isSystemWidget(id)) {
						return U.Menu.getSystemWidgets().find(it => it.id == id);
					};
					return S.Detail.get(favRootId, id);
				};
				return getObjectRef.current(block, id);
			});
		};

		return cache.get(key);
	};

	if (previewId) {
		cnb.push('isPreview');
		const block = S.Block.getLeaf(widgets, previewId);

		if (block) {
			const child = getChild(block.id);
			const object = getObject(block, child?.getTargetObjectId());
			const param = U.Data.widgetContentParam(object, block);
			const hasMenu = [ I.WidgetLayout.View, I.WidgetLayout.List, I.WidgetLayout.Compact ].includes(param.layout);

			let buttons = null;
			let menu = null;

			if (hasMenu) {
				menu = <Icon id="button-widget-more" name="common/more" className="more" withBackground={true} onClick={onMore} />;
			};

			if (!object.isSystem) {
				buttons = (
					<>
						<Icon name="common/expand" className="expand" withBackground={true} onClick={onExpand} />
						{menu}
					</>
				);
			};

			head = (
				<>
					<div className="side left">
						<Icon name="common/back" className="back" withBackground={true} onClick={e => {
							e.stopPropagation();

							setPreviewId('');
							analytics.event('ScreenHome', { view: 'Widget' });
						}} />
					</div>

					<div className="side center">
						<ObjectName object={object} withPlural={true} />
					</div>

					<div className="side right">
						{buttons}
					</div>
				</>
			);

			content = (
				<Widget 
					{...props}
					block={block}
					isPreview={true}
					setPreview={setPreviewId}
					canEdit={canWrite}
					canRemove={false}
					getObject={id => getObject(block, id)}
				/>
			);
		};
	} else {
		const sections = getSections();
		const members = U.Space.getParticipantsList([ I.ParticipantStatus.Active ]);
		const hasMembers = members.length > 1;
		const showMembers = !spaceview.isOneToOne && !spaceview.isPersonal && (hasMembers || canModerate);

		head = (
			<>
				<div className="side left">
					<Icon
						id="button-widget-panel-toggle"
						name="widget/vaultToggle"
						className="vaultToggle"
						withBackground={true}
						onClick={() => sidebar.leftPanelToggle(true, true)}
						tooltipParam={{ text: translate('commonToggleSidebar'), typeY: I.MenuDirection.Bottom }}
					/>
					<Icon
						name="header/widget"
						withBackground={true}
						onClick={() => sidebar.leftPanelSubPageToggle('widget', true, true)}
						tooltipParam={{
							text: translate('commonWidgets'),
							caption: keyboard.getCaption('widget'),
							typeY: I.MenuDirection.Bottom,
						}}
					/>
				</div>
				<div className="side right">
					{showMembers ? (
						<Icon
							id="button-widget-members"
							name={hasMembers ? 'widget/member' : 'header/invite'}
							withBackground={true}
							inner={hasMembers ? <Label className="cnt" text={String(members.length)} /> : null}
							onClick={() => Action.openSpaceShare(analytics.route.widget)}
							tooltipParam={{
								text: translate(hasMembers ? 'commonMembers' : 'commonInviteMembers'),
								typeY: I.MenuDirection.Bottom,
							}}
						/>
					) : ''}
					<Sync
						id="headerSync"
						onClick={onSync}
						tooltipParam={{ typeY: I.MenuDirection.Bottom }}
					/>
				</div>
			</>
		);

		const spaceBlock = new M.Block({ id: J.Constant.widgetId.space, type: I.BlockType.Widget, content: { layout: I.WidgetLayout.Space } });

		content = (
			<div className="content">
				<Widget
					block={spaceBlock}
					disableContextMenu={true}
					onDragStart={onDragStart}
					onDragOver={onDragOver}
					onDrag={onDrag}
					canEdit={false}
					canRemove={false}
					sidebarDirection={sidebarDirection}
					getObject={id => getObject(spaceBlock, id)}
				/>
				<SpaceName />

				{sections.map((section, i) => {
					const isSectionPin = section.id == I.WidgetSection.Pin;
					const isSectionType = section.id == I.WidgetSection.Type;
					const isSectionUnread = section.id == I.WidgetSection.Unread;
					const isSectionBin = section.id == I.WidgetSection.Bin;
					const cns = [ 'widgetSection', `section-${I.WidgetSection[section.id].toLowerCase()}` ];
					const list = getWidgets(section.id);
					const ws: any = widgetSections.find(it => it.id == section.id) || {};
					const isFavWidgets = (section.id == I.WidgetSection.MyFavorites) && (ws.view == 'widgets') && !isLinksView;
					const personalRootId = U.Object.getPersonalWidgetsId();

					if (ws.isHidden) {
						return null;
					};

					const isClosed = isSectionClosed(section.id);

					let buttons = null;
					if (isSectionType) {
						if (canWrite) {
							buttons = <Button iconParam={{ name: 'plus/widgetSection', size: 12 }} color="blank" size={28} text={translate('widgetSectionNewType')} onClick={onTypeCreate} />;
						};
					} else 
					if (!isSectionUnread) {
						buttons = <Icon name="common/more" size={12} className="more" onClick={() => onSectionContext(section.id)} />;
					};

					return (
						<AnimatePresence key={section.id} mode="popLayout">
							<motion.div 
								id={`section-${section.id}`} 
								className={cns.join(' ')} 
								key={`${section.id}-motion`}
								{...U.Common.animationProps({
									transition: { duration: 0.2, delay: i * 0.05 },
								})}
							>
								{!isSectionPin && !isSectionBin ? (
									<div
										className="nameWrap"
										onContextMenu={() => onSectionContext(section.id)}
									>
										<div className="name" onClick={() => onToggle(section.id)}>
											<Icon name="arrow/button" size={8} className="arrow" />
											{section.name}
										</div>
										<div className="buttons">
											{buttons}
										</div>
									</div>
								) : ''}

								{!isClosed ? (
									<div 
										className="items" 
										onContextMenu={e => {
											if (isSectionBin) {
												e.stopPropagation();
												onSectionContext(section.id);
											};
										}}
									>
										{isSectionPin && !isLinksView ? <WidgetHome /> : ''}

										{list.map((block, i) => (
											<Widget
												{...props}
												key={`widget-${block.id}`}
												block={block}
												index={i}
												rootId={isFavWidgets ? personalRootId : undefined}
												canEdit={canWrite}
												canRemove={isSectionPin}
												onDragStart={isFavWidgets ? undefined : onDragStartStable}
												onDragOver={isFavWidgets ? undefined : onDragOverStable}
												onDrag={isFavWidgets ? undefined : onDragStable}
												setPreview={isFavWidgets ? undefined : setPreviewId}
												sidebarDirection={sidebarDirection}
												getObject={getWidgetGetObject(block, isFavWidgets, personalRootId)}
											/>
										))}
									</div>
								) : ''}
							</motion.div>
						</AnimatePresence>
					);
				})}
			</div>
		);
	};

	useEffect(() => {
		initSections();
	});

	useEffect(() => {
		setPreviewId('');
		initSections();
		getObjectCacheRef.current.clear();
		syntheticBlockCacheRef.current.clear();
	}, [ space ]);

	/*
	 * Restore the persisted scroll position on mount, space switch, and when leaving
	 * preview (the list and preview reuse the same #body, so without this the list
	 * snaps to top and onScroll then persists the wrong value). useLayoutEffect runs
	 * before the post-swap scroll event, so the restore isn't clobbered. Skipped in
	 * preview. A ResizeObserver re-applies the position while widget content is still
	 * loading (async), then disconnects once the stored offset becomes reachable.
	 */
	useLayoutEffect(() => {
		if (previewId) {
			return;
		};

		const body = bodyRef.current;
		if (!body) {
			return;
		};

		initScroll();

		// Observe the inner content element (not the scroll container, whose own box
		// doesn't change as content grows) so we catch async widget load.
		const contentEl = body.firstElementChild;
		if (!contentEl) {
			return;
		};

		const observer = new ResizeObserver(() => {
			const top = Storage.getScroll('sidebarWidget', '', isPopup);

			if (!top || ((body.scrollHeight - body.clientHeight) >= top)) {
				if (top) {
					body.scrollTop = top;
				};
				observer.disconnect();
			};
		});
		observer.observe(contentEl);

		return () => observer.disconnect();
	}, [ space, previewId ]);

	useEffect(() => reaction(() => S.Common.sidebarView, () => forceUpdate()), []);

	return (
		<>
			<div id="head" className={[ 'head', (previewId ? 'isPreview' : 'isDefault') ].join(' ')}>
				{head}
			</div>

			<div
				id="body"
				ref={bodyRef}
				className={cnb.join(' ')}
				onScroll={onScroll}
				onDrop={onDrop}
				onDragOver={e => e.preventDefault()}
			>
				{content}
			</div>
		</>
	);

});

export default SidebarPageWidget;
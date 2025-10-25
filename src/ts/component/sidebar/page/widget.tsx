import React, { forwardRef, useRef, useEffect, useState, DragEvent } from 'react';
import raf from 'raf';
import { observer } from 'mobx-react';
import { arrayMove } from '@dnd-kit/sortable';
import { Button, Icon, Widget, IconObject, ObjectName, Sync } from 'Component';
import { I, C, M, S, U, J, keyboard, analytics, translate, scrollOnMove, Storage, Dataview } from 'Lib';

const SidebarPageWidget = observer(forwardRef<{}, I.SidebarPageComponent>((props, ref) => {

	const [ previewId, setPreviewId ] = useState('');
	const [ sectionIds, setSectionIds ] = useState([]);
	const [ dummy, setDummy ] = useState(0);
	const { widgets } = S.Block;
	const types = S.Record.getTypes();
	const childrenIds = S.Block.getChildrenIds(widgets, widgets);
	const length = childrenIds.length;
	const { sidebarDirection, isPopup } = props;
	const { space } = S.Common;
	const cnsh = [ 'subHead' ];
	const cnb = [ 'body' ];
	const spaceview = U.Space.getSpaceview();
	const canWrite = U.Space.canMyParticipantWrite();
	const counters = S.Chat.getTotalCounters();
	const isMuted = spaceview.notificationMode != I.NotificationMode.All;
	const bodyRef = useRef<HTMLDivElement>(null);
	const dropTargetIdRef = useRef<string>('');
	const positionRef = useRef<I.BlockPosition>(null);
	const isDraggingRef = useRef<boolean>(false);
	const frameRef = useRef<number>(0);

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
	let subHead = null;

	const initBlocks = () => {
		U.Subscription.createTypeCheck(() => {
			S.Block.updateTypeWidgetList();
		});
	};

	const initSections = () => {
		const newSectionIds = [];
		const ids = [ I.WidgetSection.Pin, I.WidgetSection.Type ];

		ids.forEach(id => {
			if (!isSectionClosed(id)) {
				newSectionIds.push(id);
			};
		});

		if (!U.Common.compareJSON(newSectionIds, sectionIds)) {
			setSectionIds(newSectionIds);
		} else {
			ids.forEach(initToggle);
		};
	};

	const initScroll = () => {
		const body = $(bodyRef.current);
		const top = Storage.getScroll('sidebarWidget', '', isPopup);

		body.scrollTop(top);
	};

	const onSync = () => {
		S.Menu.closeAllForced(null, () => {
			S.Menu.open('syncStatus', {
				element: '#headerSync',
				offsetY: 4,
				classNameWrap: 'fixed fromSidebar',
				subIds: J.Menu.syncStatus,
			});
		});
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
		const win = $(window);
		const body = $(bodyRef.current);
		const obj = body.find(`#widget-${block.id}`);
		const clone = $('<div />').addClass('widget isClone').css({ 
			zIndex: 10000, 
			position: 'fixed', 
			left: -10000, 
			top: -10000,
			width: obj.outerWidth(),
		});

		clone.append(obj.find('.head').clone());
		body.append(clone);
		selection?.clear();
		$('body').addClass('isDragging');

		keyboard.disableCommonDrop(true);
		keyboard.disableSelection(true);
		keyboard.setDragging(true);

		isDraggingRef.current = true;

		e.dataTransfer.setDragImage(clone.get(0), 0, 0);
		e.dataTransfer.setData('text', JSON.stringify({ blockId: block.id, section: block.content.section }));

		win.off('dragend.widget').on('dragend.widget', () => {
			onDragEnd();
			win.off('dragend.widget');
		});

		scrollOnMove.onMouseDown({ container: body, speed: 300, step: 1 });
	};

	const onDrag = (e: DragEvent, block: I.Block): void => {
		scrollOnMove.onMouseMove(e.clientX, e.clientY);
	};

	const onDragOver = (e: React.DragEvent, block: I.Block) => {
		if (!isDraggingRef.current) {
			return;
		};

		e.preventDefault();

		const target = $(e.currentTarget);
		const y = e.pageY;

		raf.cancel(frameRef.current);
		frameRef.current = raf(() => {
			clear();
			dropTargetIdRef.current = block.id;

			const { top } = target.offset();
			const height = target.height();
			const child = getChild(block.id);

			positionRef.current = y <= top + height / 2 ? I.BlockPosition.Top : I.BlockPosition.Bottom;

			if (child) {
				const t = child.getTargetObjectId();
				if (t == J.Constant.widgetId.bin) {
					positionRef.current = I.BlockPosition.Top;
				};
			};

			target.addClass([ 'isOver', (positionRef.current == I.BlockPosition.Top ? 'top' : 'bottom') ].join(' '));
		});
	};

	const onDrop = (e: React.DragEvent): void => {
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

			case I.WidgetSection.Type: {
				const child1 = getChild(blockId);
				const targetId1 = child1?.getTargetObjectId();
				const child2 = getChild(dropTargetIdRef.current);
				const targetId2 = child2?.getTargetObjectId();

				if (!targetId1 || !targetId2 || (targetId1 == targetId2)) {
					break;
				};

				const items = S.Record.checkHiddenObjects(S.Record.getTypes());
				const oldIndex = items.findIndex(it => it.id == targetId1);
				let newIndex = items.findIndex(it => it.id == targetId2) + (positionRef.current == I.BlockPosition.Bottom ? 1 : 0);

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

		onDragEnd();
	};

	const onDragEnd = () => {
		keyboard.disableCommonDrop(false);
		keyboard.disableSelection(false);
		keyboard.setDragging(false);

		isDraggingRef.current = false;
		clear();

		$('body').removeClass('isDragging');
	};

	const onScroll = () => {
		const body = $(bodyRef.current);
		const top = body.scrollTop();

		if (!previewId) {
			Storage.setScroll('sidebarWidget', '', top, isPopup);
		};
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
		U.Object.openEvent(e, object);
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

		const sort: any = view.sorts.length ? view.sorts[0] : {};

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

	const getPreviewOptions = (param: any, relationKey: string, sortType: I.SortType) => {
		const block = S.Block.getLeaf(widgets, previewId);
		const child = getChild(block.id);
		const object = getObject(block, child?.getTargetObjectId());
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

	const isSectionClosed = (id: I.WidgetSection) => {
		return Storage.checkToggle('widgetSection', String(id));
	};

	const initToggle = (id: I.WidgetSection) => {
		const body = $(bodyRef.current);
		const section = body.find(`#section-${id}`);
		const list = section.find('> .items');
		const isClosed = isSectionClosed(id);

		section.toggleClass('isOpen', !isClosed);
		list.toggleClass('isOpen', !isClosed).css({ 
			height: (isClosed ? 0 : 'auto'),
			overflow: (isClosed ? 'hidden' : 'visible'),
		});
	};

	const onToggle = (id: I.WidgetSection) => {
		const body = $(bodyRef.current);
		const section = body.find(`#section-${id}`);
		const list = section.find('> .items');
		const isClosed = isSectionClosed(id);
		const save = () => Storage.setToggle('widgetSection', String(id), !isClosed);

		let newSectionIds = [ ...sectionIds ];
		newSectionIds = isClosed ? sectionIds.concat(id) : sectionIds.filter(it => it != id);

		section.toggleClass('isOpen', isClosed);

		if (isClosed) {
			save();
			setSectionIds(newSectionIds);
			U.Common.toggle(list, 200, false);
		} else {
			U.Common.toggle(list, 200, true, () => {
				save();
				setSectionIds(sectionIds);
			});
		};
	};

	const clear = () => {
		const body = $(bodyRef.current);

		body.find('.widget.isOver').removeClass('isOver top bottom');
		body.find('.widget.isClone').remove();

		dropTargetIdRef.current = '';
		positionRef.current = null;

		raf.cancel(frameRef.current);
	};

	const getBlockWidgets = () => {
		const blocks = S.Block.getChildren(widgets, widgets, (block: I.Block) => {
			if (!block.isWidget()) {
				return false;
			};

			const child = getChild(block.id);
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

			const object = getObject(block, target);

			if (!object || object._empty_ || object.isArchived || object.isDeleted) {
				return false;
			};

			return true;
		});

		blocks.sort((a: I.Block, b: I.Block) => {
			const c1 = getChild(a.id);
			const c2 = getChild(b.id);

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
			object = S.Detail.get(J.Constant.subId.type, id);
		} else {
			object = S.Detail.get(widgets, id);
		};
		return object;
	};

	if (previewId) {
		cnb.push('isPreview');
		const block = S.Block.getLeaf(widgets, previewId);

		if (block) {
			const child = getChild(block.id);
			const object = getObject(block, child?.getTargetObjectId());
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
						<Icon className="expand withBackground" onClick={onExpand} />
						{hasMenu ? <Icon id="button-widget-more" className="more withBackground" onClick={onMore} /> : ''}
					</>
				);
			};

			subHead = (
				<div className={cnsh.join(' ')}>
					<div className="side left">
						<Icon className="back" onClick={e => {
							e.stopPropagation();

							setPreviewId('');
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
					{...props}
					key={`widget-${block.id}`}
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
		const blockWidgets = getBlockWidgets();
		const spaceBlock = new M.Block({ id: 'space', type: I.BlockType.Widget, content: { layout: I.WidgetLayout.Space } });
		const sections = [
			{ id: I.WidgetSection.Pin, name: translate('widgetSectionPinned') },
			{ id: I.WidgetSection.Type, name: translate('widgetSectionType') },
		];

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
					disableAnimation={true}
					sidebarDirection={sidebarDirection}
					getObject={id => getObject(spaceBlock, id)}
				/>

				{sections.map(section => {
					const isSectionPin = section.id == I.WidgetSection.Pin;
					const isSectionType = section.id == I.WidgetSection.Type;
					const cns = [ 'widgetSection', `section-${I.WidgetSection[section.id].toLowerCase()}` ];

					let list = blockWidgets.filter(it => it.content.section == section.id);
					let buttons = null;

					if (isSectionType) {
						if (canWrite) {
							buttons = <Button icon="plus" color="blank" className="c28" text={translate('widgetSectionNewType')} onClick={onTypeCreate} />;
						};

						if (sectionIds.includes(section.id) && (list.length > 1)) {
							list = list.sort((a, b) => {
								const c1 = getChild(a.id);
								const c2 = getChild(b.id);

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
								<div className="name" onClick={() => onToggle(section.id)}>
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
											{...props}
											key={`widget-${block.id}`}
											block={block}
											canEdit={canWrite}
											canRemove={isSectionPin}
											onDragStart={onDragStart}
											onDragOver={onDragOver}
											onDrag={onDrag}
											setPreview={setPreviewId}
											sidebarDirection={sidebarDirection}
											getObject={id => getObject(block, id)}
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

	useEffect(() => {
		const win = $(window);

		win.off('checkWidgetToggles').on('checkWidgetToggles', () => initBlocks());

		return () => {
			win.off('checkWidgetToggles');
		};
	}, []);

	useEffect(() => {
		initSections();
		initScroll();
	});

	useEffect(() => {
		setPreviewId('');
	}, [ space ]);

	useEffect(() => {
		initBlocks();
	}, [ space, types.length, childrenIds, length ]);

	return (
		<>
			<div id="head" className="head">
				<div className="side left">
					<Sync id="headerSync" onClick={onSync} />
				</div>
				<div className="side right">
					<Icon className="search withBackground" onClick={() => keyboard.onSearchPopup(analytics.route.widget)} />
				</div>
			</div>

			{subHead}

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

}));

export default SidebarPageWidget;
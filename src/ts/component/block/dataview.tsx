import React, { forwardRef, useState, useRef, useEffect } from 'react';
import $ from 'jquery';
import raf from 'raf';
import { motion, AnimatePresence } from 'motion/react';
import { arrayMove } from '@dnd-kit/sortable';
import { observer } from 'mobx-react';
import { set } from 'mobx';
import { LayoutPlug } from 'Component';
import { I, C, S, U, J, analytics, Dataview, keyboard, Onboarding, Relation, focus, translate, Action, Storage } from 'Lib';

import Controls from './dataview/controls';
import Selection from './dataview/selection';
import Filters from './dataview/filters';
import Empty from './dataview/empty';
import AddRow from './dataview/view/grid/body/add';

import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';
import ViewList from './dataview/view/list';
import ViewCalendar from './dataview/view/calendar';
import ViewGraph from './dataview/view/graph';
import ViewTimeline from './dataview/view/timeline';

interface Props extends I.BlockComponent {
	isInline?: boolean;
};

const BlockDataview = observer(forwardRef<I.BlockRef, Props>((props, ref) => {

	const { rootId, block, isPopup, isInline, readonly, onKeyDown, onKeyUp, getWrapperWidth } = props;
	const views = S.Record.getViews(rootId, block.id);
	const nodeRef = useRef(null);
	const viewRef = useRef(null);
	const controlsRef = useRef(null);
	const selectRef = useRef(null);
	const filtersRef = useRef(null);
	const isCollection = Dataview.isCollection(rootId, block.id);
	const isCreating = useRef(false);
	const frame = useRef(0);
	const timeoutFilter = useRef(0);
	const editingRecordId = useRef('');
	const filterRef = useRef('');
	const viewIdRef = useRef('');
	const menuContext = useRef(null);
	const cellRefs = useRef<Map<string, any>>(new Map());
	const recordRefs = useRef<Map<string, any>>(new Map());
	const [ searchIds, setSearchIds ] = useState<string[] | null>(null);
	const [ dummy, setDummy ] = useState<number>(0);
	const analyticsRoute = isCollection ? analytics.route.collection : analytics.route.set;

	useEffect(() => {
		const match = keyboard.getMatch(isPopup);
		const subId = getSubId();
		const viewId = match.params.viewId || block.content.viewId;
		const object = getTarget();

		if (viewId) {
			S.Record.metaSet(subId, '', { viewId });
		};

		reloadData(() => {
			if (isInline) {
				return;
			};

			const { total } = S.Record.getMeta(subId, '');
			const isCompletedSets = Onboarding.isCompleted('sets');

			window.setTimeout(() => {
				if (isCollection && !total) {
					Onboarding.start('collections', isPopup);
				} else 
				if (
					(isCollection || (isCompletedSets && !isCollection)) && 
					isAllowedObject() && 
					isAllowedDefaultType() && 
					total
				) {
					Onboarding.start('setSettings', isPopup);
				};
			}, J.Constant.delay.menu);
		});

		init();
		resize();
		rebind();

		if (!U.Object.isTypeLayout(object.layout)) {
			const view = getView();
			const eventName = isCollection ? 'ScreenCollection' : 'ScreenSet';

			analytics.event(eventName, { embedType: analytics.embedType(isInline), type: view?.type });
		};

		return () => {
			unbind();
			window.clearTimeout(timeoutFilter.current);
			cellRefs.current.clear();
			recordRefs.current.clear();
		};
	}, []);

	useEffect(() => {
		const { routeParam } = S.Common;
	
		let viewId = S.Record.getMeta(getSubId(), '').viewId;

		if ((routeParam.ref == 'widget') && routeParam.viewId) {
			viewId = routeParam.viewId;
			S.Common.routeParam = {};
		};

		if (viewId && (viewId != viewIdRef.current)) {
			loadData(viewId, 0, true);
		};

		init();
		resize();
		rebind();
	});

	useEffect(() => {
		reloadData();
	}, [ searchIds ]);

	const init = () => {
		const node = $(nodeRef.current);
		const head = node.find(`#block-head-${block.id}`);
		const object = getTarget();

		head.toggleClass('isDeleted', object.isDeleted);
	};

	const unbind = () => {
		const events = [ 'resize', 'sidebarResize', 'updateDataviewData', 'setDataviewSource', 'selectionEnd', 'selectionClear', 'selectionSet' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
	};

	const rebind = () => {
		const win = $(window);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		unbind();

		win.on(`resize.${ns} sidebarResize.${ns}`, () => resize());
		win.on(`updateDataviewData.${ns}`, () => loadData(getView().id, 0, true));
		win.on(`setDataviewSource.${ns}`, () => onSourceSelect(`#block-head-${block.id} #value`, { offsetY: 36 }));
		win.on(`selectionEnd.${ns} selectionClear.${ns} selectionSet.${ns}`, () => onSelectEnd());
	};

	const onKeyDownHandler = (e: any) => {
		if (!keyboard.isFocused) {
			onKeyDown?.(e, '', [], { from: 0, to: 0 }, props);
		};
	};

	const onKeyUpHandler = (e: any) => {
		onKeyUp?.(e, '', [], { from: 0, to: 0 }, props);
	};

	const onFocus = () => {
		if (isInline) {
			focus.set(block.id, { from: 0, to: 0 });
		};
	};

	const loadData = (viewId: string, offset: number, clear: boolean, callBack?: (message: any) => void) => {
		if (!viewId) {
			console.log('[BlockDataview.loadData] No view id');
			return;
		};

		const view = getView(viewId);
		if (!view) {
			console.log('[BlockDataview.loadData] No view');
			return;
		};

		viewIdRef.current = viewId;

		const subId = getSubId();
		const keys = getKeys(viewId);
		const sources = getSources();

		if (!sources.length && !isCollection) {
			console.log('[BlockDataview.loadData] No sources');
			return;
		};

		S.Record.metaSet(subId, '', { offset, viewId });

		if ([ I.ViewType.Calendar, I.ViewType.Timeline, I.ViewType.Graph, I.ViewType.Board ].includes(view.type)) {
			if (viewRef.current && viewRef.current.load) {
				viewRef.current.load();
			} else {
				viewIdRef.current = '';
			};
		} else {
			const filters = [];

			if (searchIds) {
				filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: searchIds || [] });
			};

			Dataview.getData({
				isInline,
				rootId, 
				subId,
				blockId: block.id, 
				newViewId: viewId, 
				keys, 
				offset: 0, 
				limit: offset + getLimit(view), 
				clear,
				sources,
				filters,
				collectionId: (isCollection ? getObjectId() : ''),
			}, callBack);
		};
	};

	const reloadData = (cb?: () => void) => {
		const view = getView();

		if (view) {
			S.Record.metaSet(getSubId(), '', { viewId: view.id, offset: 0, total: 0 });
			loadData(view.id, 0, true, cb);
		};
	};

	const getObjectId = (): string => {
		let ret = block.getTargetObjectId();
		if (!isInline && !ret) {
			ret = rootId;
		};

		return ret;
	};

	const getKeys = (id: string): string[] => {
		const view = getView(id);

		let keys = J.Relation.default.concat(J.Relation.cover);
		if (view) {
			keys = keys.concat((view.relations || []).map(it => it && it.relationKey));

			if (view.coverRelationKey && (view.coverRelationKey != J.Relation.pageCover)) {
				keys.push(view.coverRelationKey);
			};

			if (view.groupRelationKey) {
				keys.push(view.groupRelationKey);
			};

			if (view.endRelationKey) {
				keys.push(view.endRelationKey);
			};
		};

		return U.Common.arrayUnique(keys);
	};

	const getLimit = (view: I.View): number => {
		if (!view) {
			return 0;
		};

		const options = Relation.getPageLimitOptions(view.type, isInline);
		const pageLimit = Number(view.pageLimit) || options[0].id;

		let limit = 0;

		switch (view.type) {
			default: {
				limit = isInline ? pageLimit : 500;
				break;
			};

			case I.ViewType.Gallery:
			case I.ViewType.Board: {
				limit = pageLimit || 50;
				break;
			};

		};
		return limit;
	};

	const getSubId = (groupId?: string): string => {
		let ret = '';
		if (groupId) {
			ret = S.Record.getGroupSubId(rootId, block.id, groupId);
		} else {
			ret = S.Record.getSubId(rootId, block.id);
		};
		return ret;
	};

	const getRecords = (groupId?: string): string[] => {
		const subId = getSubId(groupId);
		const records = S.Record.getRecordIds(subId, '');

		return applyObjectOrder('', U.Common.objectCopy(records));
	};

	const getRecord = (id: string) => {
		const view = getView();
		if (!view) {
			return {};
		};

		const skip = [ 'restrictions' ];
		const keys = getKeys(view.id).filter(it => !skip.includes(it));
		const subId = getSubId();
		const item = S.Detail.get(subId, id, keys, true);
		const { layout, isReadonly, isDeleted, snippet } = item;

		if (item.name == translate('defaultNamePage')) {
			item.name = '';
		};
		if (U.Object.isNoteLayout(layout)) {
			item.name = snippet;
		};

		item.isReadonly = isDeleted || isReadonly;
		return item;
	};

	const getView = (viewId?: string): I.View => {
		return Dataview.getView(rootId, block.id, viewId);
	};

	const getSources = (): string[] => {
		if (isCollection) {
			return [];
		};

		const target = getTarget();
		const types = Relation.getSetOfObjects(rootId, target.id, I.ObjectLayout.Type).map(it => it.id);
		const relations = Relation.getSetOfObjects(rootId, target.id, I.ObjectLayout.Relation).map(it => it.id);

		return [].concat(types).concat(relations);
	};

	const getTarget = () => {
		return S.Detail.get(rootId, getObjectId(), [ 'setOf' ]);
	};

	const getTypeId = (): string => {
		return Dataview.getTypeId(rootId, block.id, getObjectId(), getView()?.id);
	};

	const getDetails = (groupId?: string): any => {
		return Dataview.getDetails(rootId, block.id, getObjectId(), getView()?.id, groupId);
	};

	const getMenuParam = (e: any, dir: number): any => {
		const node = $(nodeRef.current);
		const hoverArea = node.find('.hoverArea');

		const menuParam: any = {
			classNameWrap: 'fromBlock',
			onOpen: (context: any) => {
				menuContext.current = context;
				hoverArea.addClass('active');
			},
			onClose: () => {
				isCreating.current = false;
				hoverArea.removeClass('active');
			},
		};

		if (dir) {
			menuParam.element = $(e.currentTarget);
		} else {
			menuParam.horizontal = I.MenuDirection.Center;
			menuParam.recalcRect = () => {
				const { ww, wh } = U.Common.getWindowDimensions();
				return { x: ww / 2, y: wh / 2, width: 200, height: 0 };
			};
		};

		return menuParam;
	};

	const getDefaultTemplateId = (typeId?: string): string => {
		const view = getView();
		const type = S.Record.getTypeById(typeId || getTypeId());

		if (view && view.defaultTemplateId) {
			return view.defaultTemplateId;
		} else
		if (type && type.defaultTemplateId) {
			return type.defaultTemplateId;
		};
		return '';
	};

	const recordCreate = (e: any, template: any, dir: number, groupId?: string, idx?: number) => {
		const objectId = getObjectId();
		const subId = getSubId(groupId);
		const view = getView();

		if (!view || isCreating.current) {
			return;
		};

		const details = getDetails(groupId);
		const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate ];
		const isViewGraph = view.type == I.ViewType.Graph;
		const isViewCalendar = view.type == I.ViewType.Calendar;
		const isViewBoard = view.type == I.ViewType.Board;

		let typeId = '';
		let templateId = '';

		if (template) {
			templateId = template.id;

			if (template.targetObjectType) {
				typeId = template.targetObjectType;
			};
		};

		if (!typeId) {
			typeId = getTypeId();
		};

		if (!templateId) {
			templateId = getDefaultTemplateId(typeId);
		};

		const type = S.Record.getTypeById(typeId);
		if (!type) {
			console.error('[BlockDataview.recordCreate] No type');
			return;
		};

		const templateObject = S.Detail.get(rootId, templateId);
		if (templateObject.isArchived || templateObject.isDeleted) {
			templateId = '';
		};

		isCreating.current = true;

		C.ObjectCreate(details, flags, templateId, type.uniqueKey, S.Common.space, (message: any) => {
			isCreating.current = false;

			if (message.error.code) {
				return;
			};

			const object = message.details;

			S.Detail.update(subId, { id: object.id, details: object }, true);

			if (!isViewBoard && !isViewCalendar) {
				let records = getRecords(groupId);

				const oldIndex = records.indexOf(message.objectId);

				// If idx present use idx otherwise use dir to add record to the beginning or end of the list
				if (oldIndex < 0) {
					if (idx >= 0) {
						records.splice(idx, 0, message.objectId);
					} else {
						dir > 0 ? records.push(message.objectId) : records.unshift(message.objectId);
					};
				} else {	
					const newIndex = idx >= 0 ? idx : (dir > 0 ? records.length : 0);
					records = arrayMove(records, oldIndex, newIndex);
				};

				S.Record.recordsSet(subId, '', records);
			};

			if (isCollection) {
				C.ObjectCollectionAdd(objectId, [ object.id ]);
			};

			if (isViewGraph) {
				const refGraph = viewRef.current?.refGraph;
				if (refGraph) {
					refGraph.addNewNode(object.id, '', null, () => {
						$(window).trigger('updateGraphRoot', { id: object.id });
					});
				};
			};

			if (isViewGraph || isViewCalendar || (U.Object.isNoteLayout(object.layout))) {
				U.Object.openConfig(e, object);
			} else {
				window.setTimeout(() => setRecordEditingOn(e, object.id), 15);
			};

			analytics.createObject(object.type, object.layout, analyticsRoute, message.middleTime);
		});
	};

	const onEmpty = (e: any) => {
		let element = '';
		if (isInline) {
			element = `#block-${block.id} #head-source-select`;
			onSourceSelect(element, { horizontal: I.MenuDirection.Center });
		} else {
			element = `#${Relation.cellId('blockFeatured', 'setOf', rootId)}`;
			onSourceTypeSelect(element);
		};
	};

	const onRecordAdd = (e: any, dir: number, groupId?: string, menuParam?: any, idx?: number) => {
		if (e.persist) {
			e.persist();
		};

		const typeId = getTypeId();
		const type = S.Record.getTypeById(typeId);
		const view = getView();

		if ((view.type == I.ViewType.Board) && !groupId) {
			groupId = 'empty';
		};

		if (type && (U.Object.isBookmarkLayout(type.recommendedLayout) || U.Object.isChatLayout(type.recommendedLayout))) {
			onObjectMenu(e, dir, type.recommendedLayout, groupId, menuParam);
		} else {
			recordCreate(e, { id: getDefaultTemplateId() }, dir, groupId, idx);
		};
	};

	const onObjectMenu = (e: any, dir: number, layout: I.ObjectLayout, groupId?: string, param?: Partial<I.MenuParam>) => {
		param = param || {};
		param.vertical = dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom;
		param.horizontal = dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right;
		param.offsetX = dir < 0 ? -24 : 0;
		param.offsetY = 4 * -dir;

		param.data = param.data || {};
		param.data.details = getDetails(groupId);

		const objectId = getObjectId();
		const menuParam = {
			horizontal: I.MenuDirection.Center,
			...getMenuParam(e, dir),
			...param,
		};
		const cb = object => {
			if (isCollection) {
				C.ObjectCollectionAdd(objectId, [ object.id ]);
			};
		};

		switch (layout) {
			case I.ObjectLayout.Bookmark: {
				U.Menu.onBookmarkMenu(menuParam, cb);
				break;
			};

			case I.ObjectLayout.Chat: {
				U.Menu.onChatMenu(menuParam, analyticsRoute, cb);
				break;
			};
		};
	};

	const onTemplateMenu = (e: any, dir: number) => {
		if (e.persist) {
			e.persist();
		};

		const menuParam = getMenuParam(e, dir);
		const route = analyticsRoute;
		const hasSources = isCollection || getSources().length;
		const view = getView();
		const typeId = getTypeId();

		analytics.event('ClickNewOption', { route });

		let menuContext = null;

		S.Menu.open('dataviewNew', {
			...menuParam,
			classNameWrap: 'fromBlock',
			offsetY: 10,
			noAnimation: true,
			subIds: J.Menu.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
			vertical: dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom,
			horizontal: dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right,
			onOpen: context => {
				menuContext = context;
				controlsRef.current?.toggleHoverArea(true);
			},
			onClose: () => {
				menuContext = null;
				controlsRef.current?.toggleHoverArea(false);
			},
			data: {
				blockId: block.id,
				subId: getSubId(),
				targetId: getObjectId(),
				hasSources,
				getView: getView,
				withTypeSelect: isAllowedDefaultType(),
				typeId,
				templateId: getDefaultTemplateId(),
				route,
				isAllowedObject: isAllowedObject(),
				isCollection,
				onTypeChange: (id) => {
					if (id != getTypeId()) {
						const newType = S.Record.getTypeById(id);

						Dataview.viewUpdate(rootId, block.id, view.id, { defaultTypeId: id, defaultTemplateId: newType?.defaultTemplateId });
						analytics.event('DefaultTypeChange', { route });
					};
				},
				onSetDefault: id => {
					Dataview.viewUpdate(rootId, block.id, view.id, { defaultTemplateId: id });
				},
				onSelect: (item: any) => {
					if (!view) {
						return;
					};

					const typeId = getTypeId();
					const type = S.Record.getTypeById(typeId);

					if (U.Object.isBookmarkLayout(type.recommendedLayout) || U.Object.isChatLayout(type.recommendedLayout)) {
						menuContext?.close();
						onObjectMenu(e, dir, type.recommendedLayout, '', { element: `#button-${block.id}-add-record` });
					} else
					if (item.id == J.Constant.templateId.new) {
						onTemplateAdd(item.targetObjectType);
					} else {
						recordCreate(e, item, dir);
						Dataview.viewUpdate(rootId, block.id, view.id, { defaultTemplateId: item.id });

						menuContext?.close();
						analytics.event('ChangeDefaultTemplate', { route });
					};
				},
			}
		});
	};

	const onTemplateAdd = (id?: string) => {
		const typeId = id || getTypeId();
		const type = S.Record.getTypeById(typeId);
		const details: any = {
			targetObjectType: typeId,
			layout: type.recommendedLayout,
		};

		C.ObjectCreate(details, [], '', J.Constant.typeKey.template, S.Common.space, (message) => {
			if (message.error.code) {
				return;
			};

			const object = message.details;

			focus.clear(true);
			analytics.event('CreateTemplate', { objectType: typeId, route: analyticsRoute });

			U.Object.openConfig(null, object);
		});
	};

	const canCellEdit = (relation: any, record: any): boolean => {
		if (readonly) {
			return false;
		};
		if (!relation || !record || relation.isReadonlyValue || record.isReadonly) {
			return false;
		};
		if (U.Object.isNoteLayout(record.layout) && (relation.relationKey == 'name')) {
			return false;
		};
		return true;
	};

	const onCellClick = (e: any, relationKey: string, recordId: string, record?: any) => {
		if (e.button) {
			return;
		};

		if (!record) {
			record = getRecord(recordId);
		};

		const selection = S.Common.getRef('selectionProvider');
		const relation = S.Record.getRelationByKey(relationKey);
		const id = Relation.cellId(getIdPrefix(), relationKey, record.id);
		const ref = cellRefs.current.get(id);
		const view = getView();
		const isRecordEditing = (editingRecordId.current == recordId);
		const isName = relationKey == 'name';

		if (!relation || !ref || !record) {
			return;
		};

		if (isName && (relation.isReadonlyValue || record.isReadonly)) {
			U.Object.openConfig(e, record);
			return;
		};

		if (!view.isGrid() && Relation.isUrl(relation.format) && !isRecordEditing) {
			Action.openUrl(Relation.checkUrlScheme(relation.format, record[relationKey]));
			return;
		};

		if (isName && ref.isEditing && !ref.isEditing() && !isRecordEditing) {
			const ids = selection?.get(I.SelectType.Record) || [];

			if (keyboard.withCommand(e)) {
				if (!ids.length) {
					U.Object.openPopup(record);
				};
			} else {
				U.Object.openConfig(e, record);
			};
		} else {
			ref.onClick(e);
		};
	};

	const onCellChange = (id: string, relationKey: string, value: any, callBack?: (message: any) => void) => {
		const subId = getSubId();
		const relation = S.Record.getRelationByKey(relationKey);
		const record = getRecord(id);

		if (!record || !relation) {
			return;
		};

		value = Relation.formatValue(relation, value, true);

		const details: any = {};
		details[relationKey] = value;
		S.Detail.update(subId, { id, details }, false);

		C.ObjectListSetDetails([ id ], [ { key: relationKey, value } ], callBack);

		if ((undefined !== record[relationKey]) && !U.Common.compareJSON(record[relationKey], value)) {
			analytics.changeRelationValue(relation, value, { type: 'dataview', id: 'Single' });
		};
	};

	const onContext = (e: any, id: string, subId?: string): void => {
		e.preventDefault();
		e.stopPropagation();

		if (keyboard.isCmd(e)) {
			return;
		};

		subId = subId || getSubId();

		const selection = S.Common.getRef('selectionProvider');
		const view = getView();

		if (!view) {
			return;
		};
		
		let objectIds = selection?.get(I.SelectType.Record) || [];
		if (!objectIds.length || !objectIds.includes(id)) {
			objectIds = [ id ];
			selection?.set(I.SelectType.Record, objectIds);
		};

		S.Menu.open('objectContext', {
			classNameWrap: 'fromBlock',
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			onClose: () => selection.clear(),
			data: {
				blockId: block.id,
				targetId: getObjectId(),
				objectIds,
				subId,
				isCollection,
				route: analyticsRoute,
				relationKeys: getVisibleRelations().map(it => it.relationKey),
				view,
				allowedLinkTo: true,
				allowedOpen: true,
				allowedNewTab: true,
				allowedRelation: true,
				allowedCollection: true,
				allowedExport: true,
				allowedType: true,
			}
		});
	};

	const onSourceSelect = (element: any, param: Partial<I.MenuParam>) => {
		const { targetObjectId } = block.content;
		const collectionType = S.Record.getCollectionType();
		const addParam: any = {};

		let filters: I.Filter[] = [];
		
		if (isCollection) {
			filters = filters.concat([
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Collection },
			]);

			addParam.name = translate('blockDataviewCreateNewCollection');
			addParam.nameWithFilter = translate('blockDataviewCreateNewCollectionWithName');
			addParam.onClick = (details: any) => {
				C.ObjectCreate(details, [], '', collectionType?.uniqueKey, S.Common.space, message => onSelect(message.details, true));
			};
		} else {
			filters = filters.concat([
				{ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: [ I.ObjectLayout.Set, I.ObjectLayout.Type ] },
				{ relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
			]);

			addParam.name = translate('blockDataviewCreateNewSet');
			addParam.nameWithFilter = translate('blockDataviewCreateNewSetWithName');
			addParam.onClick = (details: any) => {
				C.ObjectCreateSet([], details, '', S.Common.space, message => onSelect(message.details, true));
			};
		};

		const onSelect = (item: any, isNew: boolean) => {
			C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id, (message: any) => {
				const button = $(nodeRef.current).find('#head-source-select');

				S.Detail.update(rootId, { id: item.id, details: item }, false);

				if (!isCollection && isNew && button.length) {
					button.trigger('click');
				};

				if (message.views && message.views.length) {
					loadData(message.views[0].id, 0, true);
				};

				if (isNew) {
					const ref = controlsRef.current?.getHeadRef();
					const l = String(item.name || '').length;

					if (ref) {
						ref.setValue(item.name);
						ref.setRange({ from: l, to: l });
						ref.setEditing(true);
					};
				};

				if (isInline) {
					Onboarding.start(isCollection ? 'inlineCollection' : 'inlineSet', isPopup, false, {
						parseParam: param => ({
							...param,
							element: [ `#block-${block.id}`, param.element ].join(' '),
						}),
					});
				};
			});

			analytics.event('InlineSetSetSource', { type: isNew ? 'newObject': 'externalObject' });
		};

		S.Menu.open('searchObject', Object.assign({
			element: $(element),
			className: 'single',
			classNameWrap: 'fromBlock',
			data: {
				rootId,
				blockId: block.id,
				blockIds: [ block.id ],
				value: [ targetObjectId ],
				canAdd: true,
				filters,
				addParam,
				onSelect,
				withPlural: true,
				keys: J.Relation.default.concat('setOf'),
			}
		}, param || {}));
	};

	const onSourceTypeSelect = (obj: any) => {
		const objectId = getObjectId();
		const element = $(obj);

		S.Menu.closeAll(null, () => {
			S.Menu.open('dataviewSource', {
				classNameWrap: 'fromBlock',
				element,
				horizontal: I.MenuDirection.Center,
				onOpen: () => element.addClass('active'), 
				onClose: () => element.removeClass('active'), 
				data: {
					rootId,
					objectId,
					blockId: block.id,
				}
			});
		});
	};

	const onDragRecordStart = (e: any, recordId: string) => {
		e.stopPropagation();

		const dragProvider = S.Common.getRef('dragProvider');
		const selection = S.Common.getRef('selectionProvider');
		const record = getRecord(recordId);
		const ids = selection?.get(I.SelectType.Record) || [];
		const con = $(controlsRef.current?.getNode());
		const sel = $(selectRef.current?.getNode());

		if (!ids.length) {
			ids.push(record.id);
		};

		if (!block.isDraggable()) {
			e.preventDefault();
			return;
		};

		keyboard.disableSelection(true);
		keyboard.setSelectionClearDisabled(false);

		dragProvider?.onDragStart(e, I.DropType.Record, ids, {
			getNode: () => nodeRef.current,
			onRecordDrop: onRecordDrop,
			onViewDrop: onViewDrop,
		});

		con.show();
		sel.hide();
	};

	const onRecordDrop = (targetId: string, ids: string[], position: I.BlockPosition) => {
		keyboard.disableSelection(false);

		const selection = S.Common.getRef('selectionProvider');
		const subId = getSubId();
		const view = getView();

		if (!ids.length) {
			return;
		};

		selection?.clear();

		let records = getRecords();
		if (records.indexOf(targetId) > records.indexOf(ids[0])) {
			ids = ids.reverse();
		};

		ids.forEach(id => {
			const oldIndex = records.indexOf(id);
			
			let targetIndex = records.indexOf(targetId);

			if ((position == I.BlockPosition.Top) && (oldIndex < targetIndex)) {
				targetIndex--;
			};

			records = arrayMove(records, oldIndex, targetIndex);
		});

		const cb = () => {
			S.Record.recordsSet(subId, '', records);
			objectOrderUpdate([ { viewId: view.id, groupId: '', objectIds: records } ], records, () => S.Record.recordsSet(subId, '', records));
		};

		if (view.sorts.length) {
			S.Popup.open('confirm', {
				data: {
					title: translate('popupConfirmSortRemoveTitle'),
					textConfirm: translate('commonRemove'),
					onConfirm: () => {
						C.BlockDataviewSortRemove(rootId, block.id, view.id, view.sorts.map(it => it.id), cb);
					},
				},
			});
		} else {
			cb();
		};
	};

	const onViewDrop = (targetId: string, ids: string[]) => {
		if (!targetId || !ids.length) {
			return;
		};

		const details = Dataview.getDetails(rootId, block.id, getObjectId(), targetId);
		const operations: any[] = []; 

		for (const k in details) {
			const relation = S.Record.getRelationByKey(k);

			if (!relation) {
				continue;
			};

			const value = Relation.formatValue(relation, details[k], true);

			if (Relation.isArrayType(relation.format) && (relation.format != I.RelationType.Select)) {
				operations.push({ relationKey: k, add: value });
			} else {
				operations.push({ relationKey: k, set: value });
			};
		};

		C.ObjectListModifyDetailValues(ids, operations);

		S.Common.getRef('selectionProvider')?.clear();
		selectionCheck();
	};

	const onSortAdd = (item: any, callBack?: () => void) => {
		const view = getView();
		const object = getTarget();

		C.BlockDataviewSortAdd(rootId, block.id, view.id, item, () => {
			callBack?.();

			analytics.event('AddSort', {
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	const onFilterAddClick = (menuParam: I.MenuParam, noToggle?: boolean) => {
		const { filters } = view;
		const items = filters.filter(it => S.Record.getRelationByKey(it.relationKey));
		const filtersId = U.String.toCamelCase(`view-${view.id}-filters`);

		if (items.length && !noToggle) {
			const showFilters = Storage.checkToggle(rootId, filtersId);

			Storage.setToggle(rootId, filtersId, !showFilters);
			setDummy(dummy + 1);
		} else {
			U.Menu.sortOrFilterRelationSelect(menuParam, {
				rootId,
				blockId: block.id,
				getView,
				onSelect: item => {
					const conditions = Relation.filterConditionsByType(item.format);
					const condition = conditions.length ? conditions[0].id : I.FilterCondition.None;
					const quickOptions = Relation.filterQuickOptions(item.format, condition);
					const quickOption = quickOptions.length ? quickOptions[0].id : I.FilterQuickOption.Today;

					Storage.setToggle(rootId, filtersId, true);

					onFilterAdd({
						relationKey: item.relationKey ? item.relationKey : item.id,
						condition: condition as I.FilterCondition,
						value: Relation.formatValue(item, null, false),
						quickOption,
					});
				},
			});
		};
	};

	const onFiltersClear = () => {
		Storage.setToggle(rootId, U.String.toCamelCase(`view-${view.id}-filters`), false);
	};

	const onFilterAdd = (item: any, callBack?: () => void) => {
		const view = getView();
		const object = getTarget();

		C.BlockDataviewFilterAdd(rootId, block.id, view.id, item, () => {
			callBack?.();

			analytics.event('AddFilter', {
				condition: item.condition,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	const getIdPrefix = () => {
		return [ 'dataviewCell', block.id ].join('-');
	};

	const getVisibleRelations = () => {
		const view = getView();
		if (!view) {
			return [];
		};

		const keys = S.Record.getDataviewRelationKeys(rootId, block.id);
		return view.getVisibleRelations().filter(it => keys.includes(it.relationKey));
	};

	const getEmpty = (type: string) => {
		const view = getView();
		const cn = [];

		if (isInline) {
			cn.push('withHead');
		};

		let emptyProps: any = {};

		switch (type) {
			case 'target': {
				const name = translate(isCollection ? 'blockDataviewEmptyTargetCollections' : 'blockDataviewEmptyTargetSets');
				emptyProps = {
					title: translate('blockDataviewEmptyTargetTitle'),
					description: U.String.sprintf(translate('blockDataviewEmptyTargetDescription'), name),
					button: translate('blockDataviewEmptyTargetButton'),
					onClick: () => onSourceSelect(`#block-${block.id} .dataviewEmpty .button`, {}),
				};
				break;
			};

			case 'view': {
				if (view.type != I.ViewType.Grid) {
					cn.push('withHead');
				};

				emptyProps.title = translate('commonNoObjects');

				if (isAllowedObject()) {
					emptyProps.description = translate('blockDataviewEmptyViewDescription');
					emptyProps.button = translate('commonCreateObject');
					emptyProps.onClick = e => onRecordAdd(e, 1, '', { horizontal: I.MenuDirection.Center });
				};
				break;
			};
		};

		return (
			<Empty
				{...props}
				{...emptyProps}
				className={cn.join(' ')}
				withButton={emptyProps.button && !readonly ? true : false}
			/>
		);
	};

	const getEmptyView = (type: I.ViewType) => {
		if (!isAllowedObject()) {
			return getEmpty('view');
		};

		const cn = [ 'viewContent', `view${I.ViewType[type]}` ];
		const onAdd = (e: any) => {
			if (!isCollection && !getSources().length) {
				onEmpty(e);
			} else {
				onRecordAdd(e, 1);
			};
		};

		let inner: any = null;

		switch (type) {
			case I.ViewType.List: {
				inner = <AddRow onClick={onAdd} />;
				break;
			};

			case I.ViewType.Gallery: {
				inner = (
					<AnimatePresence mode="popLayout">
						<motion.div
							className="row empty"
							{...U.Common.animationProps({
								transition: { duration: 0.2, delay: 0.1 },
							})}
						>
							<div className="card add" onClick={onAdd} />
						</motion.div>
					</AnimatePresence>
				);
				break;
			};

			case I.ViewType.Board: {
				break;
			};
		};

		return (
			<div className={cn.join(' ')}>
				{inner}
			</div>
		);
	};

	const isAllowedObject = () => {
		const root = S.Block.getLeaf(rootId, rootId);

		if (root && root.isLocked()) {
			return false;
		};

		let isAllowed = !readonly && S.Block.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		if (!isAllowed) {
			return false;
		};

		if (isAllowed && isCollection) {
			return true;
		};

		const sources = getSources();
		if (!sources.length) {
			return false;
		};

		const targetId = getObjectId();
		const types = Relation.getSetOfObjects(rootId, targetId, I.ObjectLayout.Type);
		const skipLayouts = [ I.ObjectLayout.Participant ].concat(U.Object.getFileAndSystemLayouts());

		for (const type of types) {
			if (skipLayouts.includes(type.recommendedLayout)) {
				isAllowed = false;
				break;
			};

			if (type.uniqueKey == J.Constant.typeKey.template) {
				isAllowed = false;
				break;
			};
		};

		return isAllowed;
	};

	const isAllowedDefaultType = (): boolean => {
		if (isCollection) {
			return true;
		};

		return !!Relation.getSetOfObjects(rootId, getTarget().id, I.ObjectLayout.Relation).map(it => it.id).length;
	};

	const objectOrderUpdate = (orders: any[], records: any[], callBack?: (message0: any) => void) => {
		const view = getView();

		C.BlockDataviewObjectOrderUpdate(rootId, block.id, orders, (message) => {
			if (message.error.code) {
				return;
			};

			orders.forEach((it: any) => {
				const old = block.content.objectOrder.find(item => (view.id == item.viewId) && (item.groupId == it.groupId));
				if (old) {
					set(old, it);
				} else {
					block.content.objectOrder.push(it);
				};

				window.setTimeout(() => applyObjectOrder(it.groupId, records), 30);
			});

			callBack?.(message);
		});
	};

	const applyObjectOrder = (groupId: string, records: any[]): string[] => {
		if (!block) {
			return [];
		};

		const view = getView();
		if (!view) {
			return [];
		};

		return Dataview.applyObjectOrder(rootId, block.id, view.id, groupId, records);
	};

	const onSelectToggle = (e: React.MouseEvent, id: string) => {
		e.preventDefault();
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');

		if (!selection || isInline) {
			return;
		};

		let ids = selection.get(I.SelectType.Record);
		ids = ids.includes(id) ? ids.filter(it => it != id) : ids.concat([ id ]);
		selection.set(I.SelectType.Record, ids);

		setSelected(ids);
		selectionCheck();
	};

	const selectionCheck = () => {
		const selection = S.Common.getRef('selectionProvider');
		if (!selection || !controlsRef.current || !selectRef.current) {
			return;
		};

		const con = $(controlsRef.current.getNode());
		const sel = $(selectRef.current.getNode());
		const ids = selection.get(I.SelectType.Record) || [];
		const length = ids.length;

		length ? con.hide() : con.show();
		length ? sel.show() : sel.hide();
	};

	const onSelectEnd = () => {
		const selection = S.Common.getRef('selectionProvider');

		if (!selection || isInline || readonly) {
			return;
		};

		setSelected(selection.get(I.SelectType.Record));
		selectionCheck();
	};

	const onFilterChange = (v: string) => {
		window.clearTimeout(timeoutFilter.current);
		timeoutFilter.current = window.setTimeout(() => {
			if (filterRef.current == v) {
				return;
			};

			filterRef.current = v;

			if (v) {
				U.Subscription.search({
					filters: [],
					sorts: [],
					fullText: v,
					keys: [ 'id' ],
				}, (message: any) => {
					setSearchIds((message.records || []).map(it => it.id));
				});
			} else {
				setSearchIds(null);
			};

			analytics.event('ScreenSearchDataview', { route: analyticsRoute });
		}, J.Constant.delay.keyboard);
	};

	const setSelected = (ids: string[]) => {
		selectRef.current?.setIds(ids);
	};

	const onEditModeClick = (e: any, id: string) => {
		e.preventDefault();
		e.stopPropagation();

		if (editingRecordId.current == id) {
			setRecordEditingOff(id);
		} else {
			setRecordEditingOn(e, id);
		};
	};

	const setRecordEditingOn = (e: any, id: string) => {
		const ref = recordRefs.current.get(id);
		const nameId = Relation.cellId(getIdPrefix(), 'name', id);
		const nameRef = cellRefs.current.get(nameId);
		const win = $(window);

		if (ref && ref.setIsEditing) {
			ref.setIsEditing(true);
			editingRecordId.current = id;
		};

		nameRef?.onClick(e);

		win.on(`mousedown.record-${id}`, (e: any) => {
			if ($(e.target).parents(`#record-${id}, .menu`).length > 0) {
				return;
			};

			setRecordEditingOff(id);
		});

		win.on(`keydown.record-${id}`, (e) => {
			keyboard.shortcut('escape, enter', e, () => setRecordEditingOff(id));
		});
	};

	const setRecordEditingOff = (id: string) => {
		const ref = recordRefs.current.get(id);
		const win = $(window);
		const pageContainer = getPageContainer();

		win.off(`mousedown.record-${id} keydown.record-${id}`);

		const nameId = Relation.cellId(getIdPrefix(), 'name', id);
		const nameRef = cellRefs.current.get(nameId);

		if (ref && ref.setIsEditing) {
			ref.setIsEditing(false);
			editingRecordId.current = '';
		};

		if (nameRef) {
			nameRef.onBlur();
		};

		$(pageContainer).trigger('mousedown');
	};

	const multiSelectAction = (id: string) => {
		const selection = S.Common.getRef('selectionProvider');

		if (!selection || isInline) {
			return;
		};

		const objectId = getObjectId();
		const ids = selection.get(I.SelectType.Record);
		const count = ids.length;

		switch (id) {
			case 'archive': {
				Action.archiveCheckType(getSubId(), ids, analyticsRoute);
				break;
			};

			case 'unlink': {
				C.ObjectCollectionRemove(objectId, ids, () => {
					analytics.event('UnlinkFromCollection', { count });
				});
				break;
			};
		};

		selection.clear();
	};

	const resize = () => {
		if (frame.current) {
			raf.cancel(frame.current);
		};

		frame.current = raf(() => {
			if (getWrapperWidth) {
				const node = $(nodeRef.current);
				const obj = $(`#block-${block.id}`);

				obj.toggleClass('isVertical', node.width() <= getWrapperWidth() / 2);
			};

			controlsRef.current?.resize();

			if (viewRef.current && viewRef.current.resize) {
				viewRef.current.resize();
			};
		});
	};

	const getPageContainer = () => {
		return U.Common.getCellContainer(isPopup ? 'popup' : 'page');
	};

	if (!views.length) {
		return null;
	};

	const view = getView();
	if (!view) {
		return null;
	};

	const sources = getSources();
	const targetId = getTarget();
	const cn = [ 'focusable', `c${block.id}` ];

	const { groupRelationKey, endRelationKey, pageLimit, defaultTemplateId } = view;
	const className = [ U.String.toCamelCase(`view-${I.ViewType[view.type]}`) ];
	const showFilters = Storage.checkToggle(rootId, U.String.toCamelCase(`view-${view.id}-filters`));

	let ViewComponent: any = null;
	let body = null;

	if (isCollection) {
		className.push('isCollection');
	};

	switch (view.type) {
		default:
		case I.ViewType.Grid:
			ViewComponent = ViewGrid;
			break;
			
		case I.ViewType.Board:
			ViewComponent = ViewBoard;
			break;
			
		case I.ViewType.Gallery:
			ViewComponent = ViewGallery;
			break;
		
		case I.ViewType.List:
			ViewComponent = ViewList;
			break;

		case I.ViewType.Calendar:
			ViewComponent = ViewCalendar;
			break;

		case I.ViewType.Graph:
			ViewComponent = ViewGraph;
			break;

		case I.ViewType.Timeline:
			ViewComponent = ViewTimeline;
			break;
	};

	const dataviewProps = {
		readonly,
		isCollection,
		isInline,
		className: className.join(' '),
		getRecord,
		loadData,
		getView,
		getTarget,
		getSources,
		getRecords,
		getKeys,
		getIdPrefix,
		getLimit: () => getLimit(view),
		getVisibleRelations,
		getTypeId,
		getTemplateId: getDefaultTemplateId,
		getEmpty,
		getEmptyView,
		getSubId,
		onRecordAdd,
		onTemplateMenu,
		onTemplateAdd,
		onSortAdd,
		onFilterAdd,
		onFilterAddClick,
		isAllowedObject,
		isAllowedDefaultType,
		onSourceSelect,
		onSourceTypeSelect,
		onViewSettings: () => controlsRef.current?.onViewSettings?.(),
		getSearchIds: () => searchIds,
		canCellEdit,
		onEditModeClick,
		setRecordEditingOn,
		setRecordEditingOff,
	};

	if (isInline && !targetId) {
		body = getEmpty('target');
	} else
	if (!isCollection && !sources.length) {
		body = (
			<LayoutPlug
				layoutFormat={I.LayoutFormat.List}
				recommendedLayout={I.ObjectLayout.Set}
				viewType={view.type}
				isPopup={isPopup}
				onClick={onEmpty}
			/>
		);
	} else {
		body = (
			<div className="content">
				<ViewComponent 
					key={`view${view.id}`}
					ref={viewRef} 
					onRefCell={(ref: any, id: string) => cellRefs.current.set(id, ref)}
					onRefRecord={(ref: any, id: string) => recordRefs.current.set(id, ref)}
					{...props}
					{...dataviewProps}
					pageContainer={getPageContainer()}
					onCellClick={onCellClick}
					onCellChange={onCellChange}
					onContext={onContext}
					objectOrderUpdate={objectOrderUpdate}
					applyObjectOrder={applyObjectOrder}
					onDragRecordStart={onDragRecordStart}
					onSelectEnd={onSelectEnd}
					onSelectToggle={onSelectToggle}
				/>
			</div>
		);
	};

	return (
		<div 
			ref={nodeRef}
			tabIndex={0} 
			className={cn.join(' ')}
			onKeyDown={onKeyDownHandler} 
			onKeyUp={onKeyUpHandler} 
			onFocus={onFocus}
		>
			<div className="hoverArea">
				<Controls 
					ref={controlsRef} 
					{...props} 
					{...dataviewProps} 
					onFilterChange={onFilterChange}
				/>
				<Selection 
					ref={selectRef} 
					{...props} 
					{...dataviewProps} 
					multiSelectAction={multiSelectAction} 
				/>
			</div>

			{showFilters ? (
				<Filters
					ref={filtersRef}
					{...props}
					{...dataviewProps}
					onClear={onFiltersClear}
				/>
			) : ''}

			{body}
		</div>
	);

}));

export default BlockDataview;

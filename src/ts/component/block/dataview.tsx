import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { set } from 'mobx';
import { I, C, UtilCommon, UtilData, UtilObject, analytics, Dataview, keyboard, Onboarding, Relation, Renderer, focus, translate, Action, UtilDate, Storage } from 'Lib';
import { blockStore, menuStore, dbStore, detailStore, commonStore } from 'Store';
import Constant from 'json/constant.json';

import Controls from './dataview/controls';
import Selection from './dataview/selection';
import Empty from './dataview/empty';

import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';
import ViewList from './dataview/view/list';
import ViewCalendar from './dataview/view/calendar';
import ViewGraph from './dataview/view/graph';

interface Props extends I.BlockComponent {
	isInline?: boolean;
};

interface State {
	loading: boolean;
};

const BlockDataview = observer(class BlockDataview extends React.Component<Props, State> {

	state = {
		loading: false,
	};
	node = null;
	refView = null;
	refControls = null;
	refSelect = null;
	refCells: Map<string, any> = new Map();

	viewId = '';
	creating = false;
	frame = 0;
	isMultiSelecting = false;
	selected: string[] = [];
	menuContext = null;
	timeoutFilter = 0;
	searchIds = null;
	filter = '';

	constructor (props: Props) {
		super(props);
		
		this.loadData = this.loadData.bind(this);
		this.getRecords = this.getRecords.bind(this);
		this.getRecord = this.getRecord.bind(this);
		this.getView = this.getView.bind(this);
		this.getSources = this.getSources.bind(this);
		this.getKeys = this.getKeys.bind(this);
		this.getIdPrefix = this.getIdPrefix.bind(this);
		this.getVisibleRelations = this.getVisibleRelations.bind(this);
		this.getEmpty = this.getEmpty.bind(this);
		this.getTarget = this.getTarget.bind(this);
		this.getTypeId = this.getTypeId.bind(this);
		this.getDefaultTemplateId = this.getDefaultTemplateId.bind(this);
		this.onRecordAdd = this.onRecordAdd.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.onContext = this.onContext.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onSourceSelect = this.onSourceSelect.bind(this);
		this.onSourceTypeSelect = this.onSourceTypeSelect.bind(this);
		this.onEmpty = this.onEmpty.bind(this);
		this.onDragRecordStart = this.onDragRecordStart.bind(this);
		this.onRecordDrop = this.onRecordDrop.bind(this);
		this.onTemplateMenu = this.onTemplateMenu.bind(this);
		this.onTemplateAdd = this.onTemplateAdd.bind(this);
		this.onSelectEnd = this.onSelectEnd.bind(this);
		this.onSelectToggle = this.onSelectToggle.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);

		this.getSearchIds = this.getSearchIds.bind(this);
		this.objectOrderUpdate = this.objectOrderUpdate.bind(this);
		this.multiSelectAction = this.multiSelectAction.bind(this);
		this.applyObjectOrder = this.applyObjectOrder.bind(this);

		this.isAllowedObject = this.isAllowedObject.bind(this);
		this.isAllowedDefaultType = this.isAllowedDefaultType.bind(this);
		this.isCollection = this.isCollection.bind(this);
		this.canCellEdit = this.canCellEdit.bind(this);
	};

	render () {
		const { rootId, block, isPopup, isInline, readonly } = this.props;
		const { loading } = this.state;
		const views = dbStore.getViews(rootId, block.id);

		if (!views.length) {
			return null;
		};

		const view = this.getView();
		if (!view) {
			return null;
		};

		const sources = this.getSources();
		const targetId = this.getObjectId();
		const isCollection = this.isCollection();
		const cn = [ 'focusable', 'c' + block.id ];

		const { groupRelationKey, pageLimit, defaultTemplateId } = view;
		const className = [ UtilCommon.toCamelCase('view-' + I.ViewType[view.type]) ];

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
		};

		const dataviewProps = {
			readonly,
			isCollection,
			isInline,
			className: className.join(' '),
			getRecord: this.getRecord,
			loadData: this.loadData,
			getView: this.getView,
			getTarget: this.getTarget,
			getSources: this.getSources,
			getRecords: this.getRecords,
			getKeys: this.getKeys,
			getIdPrefix: this.getIdPrefix,
			getLimit: () => this.getLimit(view.type),
			getVisibleRelations: this.getVisibleRelations,
			getTypeId: this.getTypeId,
			getTemplateId: this.getDefaultTemplateId,
			getEmpty: this.getEmpty,
			onRecordAdd: this.onRecordAdd,
			onTemplateMenu: this.onTemplateMenu,
			onTemplateAdd: this.onTemplateAdd,
			isAllowedObject: this.isAllowedObject,
			isAllowedDefaultType: this.isAllowedDefaultType,
			onSourceSelect: this.onSourceSelect,
			onSourceTypeSelect: this.onSourceTypeSelect,
			onViewSettings: () => {
				console.log(this.refControls, this.refControls.onViewSettings);

				if (this.refControls && this.refControls.onViewSettings) {
					this.refControls.onViewSettings();
				};
			},
			getSearchIds: this.getSearchIds,
			canCellEdit: this.canCellEdit,
		};

		if (loading) {
			body = null;
		} else
		if (isInline && !targetId) {
			body = this.getEmpty('target');
		} else
		if (!isCollection && !sources.length) {
			body = this.getEmpty('source');
		} else {
			body = (
				<div className="content">
					<ViewComponent 
						key={'view' + view.id}
						ref={ref => this.refView = ref} 
						onRef={(ref: any, id: string) => this.refCells.set(id, ref)} 
						{...this.props}
						{...dataviewProps}
						pageContainer={UtilCommon.getCellContainer(isPopup ? 'popup' : 'page')}
						onCellClick={this.onCellClick}
						onCellChange={this.onCellChange}
						onContext={this.onContext}
						objectOrderUpdate={this.objectOrderUpdate}
						applyObjectOrder={this.applyObjectOrder}
						onDragRecordStart={this.onDragRecordStart}
						onSelectEnd={this.onSelectEnd}
						onSelectToggle={this.onSelectToggle}
						refCells={this.refCells}
					/>
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node}
				tabIndex={0} 
				className={cn.join(' ')}
				onKeyDown={this.onKeyDown} 
				onKeyUp={this.onKeyUp} 
				onFocus={this.onFocus}
			>
				<div className="hoverArea">
					<Controls 
						ref={ref => this.refControls = ref} 
						{...this.props} 
						{...dataviewProps} 
						onFilterChange={this.onFilterChange}
					/>
					<Selection 
						ref={ref => this.refSelect = ref} 
						{...this.props} 
						{...dataviewProps} 
						multiSelectAction={this.multiSelectAction} 
					/>
				</div>
				{body}
			</div>
		);
	};

	componentDidMount () {
		const { isInline, isPopup } = this.props;
		const view = this.getView();

		this.reloadData();
		this.init();
		this.resize();
		this.rebind();

		const eventName = this.isCollection() ? 'ScreenCollection' : 'ScreenSet';
		analytics.event(eventName, { embedType: analytics.embedType(isInline), type: view?.type });

		if (!isInline && Onboarding.isCompleted('mainSet') && this.isAllowedObject() && this.isAllowedDefaultType()) {
			Onboarding.start('setSettings', isPopup);
		};
	};

	componentDidUpdate () {
		const { rootId, block } = this.props;
		const { viewId } = dbStore.getMeta(dbStore.getSubId(rootId, block.id), '');

		if (viewId && (viewId != this.viewId)) {
			this.loadData(viewId, 0, true);
		};

		this.init();
		this.resize();
		this.rebind();
	};

	componentWillUnmount () {
		this.unbind();
	};

	init () {
		const { block } = this.props;
		const node = $(this.node);
		const head = node.find(`#block-head-${block.id}`);
		const object = this.getTarget();

		object.isDeleted ? head.addClass('isDeleted') : head.removeClass('isDeleted');
	};

	unbind () {
		const { block } = this.props;
		const events = [ 'resize', 'sidebarResize', 'updateDataviewData', 'setDataviewSource', 'selectionEnd', 'selectionClear' ];

		$(window).off(events.map(it => `${it}.${block.id}`).join(' '));
	};

	rebind () {
		const { block } = this.props;
		const win = $(window);

		this.unbind();

		win.on(`resize.${block.id} sidebarResize.${block.id}`, () => this.resize());
		win.on(`updateDataviewData.${block.id}`, () => this.loadData(this.getView().id, 0, true));
		win.on(`setDataviewSource.${block.id}`, () => this.onSourceSelect(`#block-head-${block.id} #value`, { offsetY: 36 }));
		win.on(`selectionEnd.${block.id}`, () => this.onSelectEnd());
		win.on(`selectionClear.${block.id}`, () => this.onSelectEnd());
	};

	onKeyDown (e: any) {
		const { onKeyDown } = this.props;

		if (keyboard.isFocused) {
			return;
		};

		if (onKeyDown) {
			onKeyDown(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onKeyUp (e: any) {
		const { onKeyUp } = this.props;

		if (onKeyUp) {
			onKeyUp(e, '', [], { from: 0, to: 0 }, this.props);
		};
	};

	onFocus () {
		focus.set(this.props.block.id, { from: 0, to: 0 });
	};

	loadData (viewId: string, offset: number, clear: boolean, callBack?: (message: any) => void) {
		if (!viewId) {
			console.log('[BlockDataview.loadData] No view id');
			return;
		};

		const view = this.getView(viewId);
		if (!view) {
			console.log('[BlockDataview.loadData] No view');
			return;
		};

		this.viewId = viewId;

		const { rootId, block } = this.props;
		const subId = this.getSubId();
		const keys = this.getKeys(viewId);
		const sources = this.getSources();
		const isCollection = this.isCollection();

		if (!sources.length && !isCollection) {
			console.log('[BlockDataview.loadData] No sources');
			return;
		};

		if (clear) {
			dbStore.recordsSet(subId, '', []);
		};

		dbStore.metaSet(subId, '', { offset, viewId });

		if (view.type == I.ViewType.Board) {
			if (this.refView && this.refView.loadGroupList) {
				this.refView.loadGroupList();
			} else {
				this.viewId = '';
			};
		} else 
		if (view.type == I.ViewType.Calendar) {
			if (this.refView && this.refView.load) {
				this.refView.load();
			} else {
				this.viewId = '';
			};
		} else {
			if (clear) {
				this.setState({ loading: true });
			};

			const filters = [];

			if (this.searchIds) {
				filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.In, value: this.searchIds || [] });
			};

			Dataview.getData({
				rootId, 
				blockId: block.id, 
				newViewId: viewId, 
				keys, 
				offset: 0, 
				limit: offset + this.getLimit(view.type), 
				clear,
				sources,
				filters,
				collectionId: (isCollection ? this.getObjectId() : ''),
			}, (message: any) => {
				if (clear) {
					this.setState({ loading: false });
				};

				if (callBack) {
					callBack(message);
				};
			});
		};
	};

	reloadData () {
		const { rootId, block } = this.props;
		const view = this.getView();

		if (view) {
			dbStore.metaSet(rootId, block.id, { viewId: view.id, offset: 0, total: 0 });
			this.loadData(view.id, 0, true);
		};
	};

	getObjectId (): string {
		const { rootId, block, isInline } = this.props;
		return isInline ? block.content.targetObjectId : rootId;
	};

	getKeys (id: string): string[] {
		const view = this.getView(id);

		let keys = Constant.defaultRelationKeys.concat(Constant.coverRelationKeys);
		if (view) {
			keys = keys.concat((view.relations || []).map(it => it && it.relationKey));

			if (view.coverRelationKey && (view.coverRelationKey != Constant.pageCoverRelationKey)) {
				keys.push(view.coverRelationKey);
			};

			if (view.groupRelationKey) {
				keys.push(view.groupRelationKey);
			};
		};

		return UtilCommon.arrayUnique(keys);
	};

	getLimit (type: I.ViewType): number {
		const { isInline } = this.props;
		const view = this.getView();
		const options = Relation.getPageLimitOptions(view.type);
		const pageLimit = Number(view.pageLimit) || options[0].id;

		let limit = 0;

		switch (type) {
			default:
				limit = isInline ? pageLimit : 0;
				break;

			case I.ViewType.Board:
				limit = pageLimit || 50;
				break;
			
		};
		return limit;
	};

	getSubId (groupId?: string): string {
		const { rootId, block } = this.props;

		return groupId ? dbStore.getGroupSubId(rootId, block.id, groupId) : dbStore.getSubId(rootId, block.id);
	};

	getRecords (groupId?: string): string[] {
		const subId = this.getSubId(groupId);
		const records = dbStore.getRecordIds(subId, '');

		return this.applyObjectOrder('', UtilCommon.objectCopy(records));
	};

	getRecord (id: string) {
		const view = this.getView();
		if (!view) {
			return {};
		};

		const keys = this.getKeys(view.id);
		const subId = this.getSubId();
		const item = detailStore.get(subId, id, keys);
		const { layout, isReadonly, isDeleted, snippet } = item;

		if (item.name == translate('defaultNamePage')) {
			item.name = '';
		};
		if (layout == I.ObjectLayout.Note) {
			item.name = snippet;
		};

		item.isReadonly = isDeleted || isReadonly;
		return item;
	};

	getView (viewId?: string): I.View {
		const { rootId, block } = this.props;
		return Dataview.getView(rootId, block.id, viewId);
	};

	getSources (): string[] {
		if (this.isCollection()) {
			return [];
		};

		const { rootId } = this.props;
		const target = this.getTarget();
		const types = Relation.getSetOfObjects(rootId, target.id, I.ObjectLayout.Type).map(it => it.id);
		const relations = Relation.getSetOfObjects(rootId, target.id, I.ObjectLayout.Relation).map(it => it.id);

		return [].concat(types).concat(relations);
	};

	getTarget () {
		const { rootId, block, isInline } = this.props;
		const { targetObjectId } = block.content;

		return detailStore.get(rootId, isInline ? targetObjectId : rootId, [ 'setOf' ]);
	};

	getTypeId (): string {
		const { rootId, block } = this.props;
		const objectId = this.getObjectId();
		const view = this.getView();

		return Dataview.getTypeId(rootId, block.id, objectId, view.id);
	};

	getDetails (groupId?: string): any {
		const { rootId, block } = this.props;
		const objectId = this.getObjectId();
		const view = this.getView();

		return Dataview.getDetails(rootId, block.id, objectId, view.id, groupId);
	};

	getMenuParam (e: any, dir: number): any {
		const node = $(this.node);
		const hoverArea = node.find('.hoverArea');

		const menuParam: any = {
			onOpen: (context: any) => {
				this.menuContext = context;
				hoverArea.addClass('active');
			},
			onClose: () => {
				this.creating = false;
				hoverArea.removeClass('active');
			},
		};

		if (dir) {
			menuParam.element = $(e.currentTarget);
		} else {
			menuParam.horizontal = I.MenuDirection.Center;
			menuParam.recalcRect = () => {
				const { ww, wh } = UtilCommon.getWindowDimensions();
				return { x: ww / 2, y: wh / 2, width: 200, height: 0 };
			};
		};

		return menuParam;
	};

	getDefaultTemplateId (typeId?: string): string {
		const view = this.getView();
		const type = dbStore.getTypeById(typeId || this.getTypeId());

		if (view && view.defaultTemplateId) {
			return view.defaultTemplateId;
		} else
		if (type && type.defaultTemplateId) {
			return type.defaultTemplateId;
		};
		return Constant.templateId.blank;
	};

	recordCreate (e: any, template: any, dir: number, groupId?: string) {
		const { rootId } = this.props;
		const objectId = this.getObjectId();
		const subId = this.getSubId(groupId);
		const isCollection = this.isCollection();
		const view = this.getView();

		if (!view || this.creating) {
			return;
		};

		const details = this.getDetails(groupId);
		const flags: I.ObjectFlag[] = [];
		
		let typeId = '';
		let templateId = '';

		flags.push(I.ObjectFlag.SelectTemplate);

		if (template) {
			templateId = template.id;

			if (template.targetObjectType) {
				typeId = template.targetObjectType;
			};
		};

		if (!typeId) {
			typeId = this.getTypeId();
		};
		if (!templateId) {
			templateId = this.getDefaultTemplateId(typeId);
		};

		const type = dbStore.getTypeById(typeId);
		if (!type) {
			return;
		};

		const templateObject = detailStore.get(rootId, templateId);
		if (templateObject.isArchived || templateObject.isDeleted) {
			templateId = '';
		};

		this.creating = true;

		C.ObjectCreate(details, flags, templateId, type.uniqueKey, commonStore.space, (message: any) => {
			this.creating = false;

			if (message.error.code) {
				return;
			};

			let records = this.getRecords(groupId);

			const object = message.details;
			const oldIndex = records.indexOf(message.objectId);

			if (isCollection) {
				C.ObjectCollectionAdd(objectId, [ object.id ]);
			};

			detailStore.update(subId, { id: object.id, details: object }, true);

			if (oldIndex < 0) {
				dir > 0 ? records.push(message.objectId) : records.unshift(message.objectId);
			} else {
				records = arrayMove(records, oldIndex, dir > 0 ? records.length : 0);
			};

			if (groupId) {
				this.objectOrderUpdate([ { viewId: view.id, groupId, objectIds: records } ], records, () => dbStore.recordsSet(subId, '', records));
			} else {
				dbStore.recordsSet(subId, '', records);
			};

			if ([ I.ViewType.Graph ].includes(view.type)) {
				const refGraph = this.refView?.refGraph;
				if (refGraph) {
					refGraph.addNewNode(object.id, '', null, () => {
						refGraph.setRootId(object.id);
					});
				};
			};

			if ([ I.ViewType.Calendar ].includes(view.type)) {
				UtilObject.openPopup(object);
			} else {
				const id = Relation.cellId(this.getIdPrefix(), 'name', object.id);
				const ref = this.refCells.get(id);

				if (object.layout == I.ObjectLayout.Note) {
					this.onCellClick(e, 'name', object.id);
				} else
				if (ref) {
					window.setTimeout(() => ref.onClick(e), 15);
				};

				analytics.createObject(object.type, object.layout, this.analyticsRoute(), message.middleTime);
			};
		});
	};

	onEmpty (e: any) {
		const { isInline } = this.props;

		if (isInline) {
			this.onSourceSelect(e.currentTarget, { horizontal: I.MenuDirection.Center });
		} else {
			this.onSourceTypeSelect(e.currentTarget);
		};
	};

	onRecordAdd (e: any, dir: number, groupId?: string, menuParam?: any) {
		if (e.persist) {
			e.persist();
		};

		const typeId = this.getTypeId();
		const type = dbStore.getTypeById(typeId);

		if (type && (type.uniqueKey == Constant.typeKey.bookmark)) {
			this.onBookmarkMenu(e, dir, groupId, menuParam);
		} else {
			this.recordCreate(e, { id: this.getDefaultTemplateId() }, dir, groupId);
		};
	};

	onBookmarkMenu (e: any, dir: number, groupId?: string, param?: any) {
		param = param || {};

		const objectId = this.getObjectId();
		const details = this.getDetails(groupId);
		const menuParam = this.getMenuParam(e, dir);

		menuStore.open('dataviewCreateBookmark', {
			...menuParam,
			type: I.MenuType.Horizontal,
			vertical: dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom,
			horizontal: dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right,
			offsetX: dir < 0 ? -24 : 0,
			offsetY: 4 * -dir,
			data: {
				details,
				onSubmit: (bookmark) => {
					if (this.isCollection()) {
						C.ObjectCollectionAdd(objectId, [ bookmark.id ]);
					};
				}
			},
			...param,
		});
	};

	onTemplateMenu (e: any, dir: number) {
		if (e.persist) {
			e.persist();
		};

		const { rootId, block } = this.props;
		const menuParam = this.getMenuParam(e, dir);
		const isCollection = this.isCollection();
		const route = this.analyticsRoute();
		const hasSources = isCollection || this.getSources().length;
		const view = this.getView();
		const typeId = this.getTypeId();

		analytics.event('ClickNewOption', { route });

		let menuContext = null;

		menuStore.open('dataviewTemplateList', {
			...menuParam,
			offsetY: 10,
			noAnimation: true,
			subIds: Constant.menuIds.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
			vertical: dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom,
			horizontal: dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right,
			onOpen: context => menuContext = context,
			data: {
				rootId,
				blockId: block.id,
				hasSources,
				getView: this.getView,
				withTypeSelect: this.isAllowedDefaultType(),
				typeId,
				templateId: this.getDefaultTemplateId(),
				route,
				onTypeChange: (id) => {
					if (id != this.getTypeId()) {
						Dataview.viewUpdate(rootId, block.id, view.id, { defaultTypeId: id, defaultTemplateId: Constant.templateId.blank });
						analytics.event('DefaultTypeChange', { route });
					};
				},
				onSetDefault: (item) => {
					Dataview.viewUpdate(rootId, block.id, view.id, { defaultTemplateId: item.id });
				},
				onSelect: (item: any) => {
					if (!view) {
						return;
					};

					const typeId = this.getTypeId();
					const type = dbStore.getTypeById(typeId);

					if (type && (type.uniqueKey == Constant.typeKey.bookmark)) {
						menuContext.close();
						this.onBookmarkMenu(e, dir, '', { element: `#button-${block.id}-add-record` });
					} else
					if (item.id == Constant.templateId.new) {
						this.onTemplateAdd(item.targetObjectType);
					} else {
						this.recordCreate(e, item, dir);
						Dataview.viewUpdate(rootId, block.id, view.id, { defaultTemplateId: item.id });

						menuContext.close();
						analytics.event('ChangeDefaultTemplate', { route });
					};
				}
			}
		});
	};

	onTemplateAdd (id?: string) {
		const typeId = id || this.getTypeId();
		const type = dbStore.getTypeById(typeId);
		const details: any = {
			targetObjectType: typeId,
			layout: type.recommendedLayout,
		};

		C.ObjectCreate(details, [], '', Constant.typeKey.template, commonStore.space, (message) => {
			if (message.error.code) {
				return;
			};

			const object = message.details;

			focus.clear(true);
			analytics.event('CreateTemplate', { objectType: typeId, route: this.analyticsRoute() });

			UtilObject.openPopup(object);
		});
	};

	canCellEdit (relation: any, record: any): boolean {
		const { readonly } = this.props;
		if (readonly) {
			return false;
		};

		if (!relation || !record || relation.isReadonlyValue || record.isReadonly) {
			return false;
		};
		if ((record.layout == I.ObjectLayout.Note) && (relation.relationKey == 'name')) {
			return false;
		};
		return true;
	};

	onCellClick (e: any, relationKey: string, recordId: string) {
		if (e.button) {
			return;
		};

		const { dataset } = this.props;
		const { selection } = dataset || {};
		const relation = dbStore.getRelationByKey(relationKey);
		const id = Relation.cellId(this.getIdPrefix(), relationKey, recordId);
		const ref = this.refCells.get(id);
		const record = this.getRecord(recordId);
		const view = this.getView();

		if (!relation || !ref || !record) {
			return;
		};

		if (!view.isGrid() && Relation.isUrl(relation.format)) {
			Renderer.send('urlOpen', Relation.getUrlScheme(relation.format, record[relationKey]) + record[relationKey]);
			return;
		};

		if ((relationKey == 'name') && (!ref.ref.state.isEditing)) {
			const ids = selection ? selection.get(I.SelectType.Record) : [];

			if (keyboard.withCommand(e)) {
				if (!ids.length) {
					UtilObject.openWindow(record);
				};
			} else {
				UtilObject.openConfig(record);
			};
		} else {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const subId = this.getSubId();
		const relation = dbStore.getRelationByKey(relationKey);

		if (!relation) {
			return;
		};

		value = Relation.formatValue(relation, value, true);

		const details: any = {};
		details[relationKey] = value;
		detailStore.update(subId, { id, details }, false);

		C.ObjectListSetDetails([ id ], [ { key: relationKey, value } ], callBack);

		const key = Relation.checkRelationValue(relation, value) ? 'ChangeRelationValue' : 'DeleteRelationValue';		
		analytics.event(key, { type: 'dataview' });
	};

	onContext (e: any, id: string): void {
		e.preventDefault();
		e.stopPropagation();

		const { dataset } = this.props;
		const { selection } = dataset || {};
		const subId = this.getSubId();
		const isCollection = this.isCollection();
		const view = this.getView();

		if (!view) {
			return;
		};
		
		let objectIds = selection ? selection.get(I.SelectType.Record) : [];
		if (!objectIds.length) {
			objectIds = [ id ];
		};

		menuStore.open('dataviewContext', {
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			onClose: () => selection.clear(),
			data: {
				targetId: this.getObjectId(),
				objectIds,
				subId,
				isCollection,
				route: this.analyticsRoute(),
				relationKeys: this.getVisibleRelations().map(it => it.relationKey),
				allowedLink: true,
				allowedOpen: true,
			}
		});
	};

	onSourceSelect (element: any, param: Partial<I.MenuParam>) {
		const { rootId, block, isPopup, isInline } = this.props;
		const { targetObjectId } = block.content;
		const isCollection = this.isCollection();
		const collectionType = dbStore.getCollectionType();
		const addParam: any = {};

		let filters: I.Filter[] = [];
		
		if (isCollection) {
			filters = filters.concat([
				{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Collection },
			]);

			addParam.name = translate('blockDataviewCreateNewCollection');
			addParam.onClick = (details: any) => {
				C.ObjectCreate({ ...details, layout: I.ObjectLayout.Collection }, [], '', collectionType?.uniqueKey, commonStore.space, message => onSelect(message.details, true));
			};
		} else {
			filters = filters.concat([
				{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Set },
				{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
			]);

			addParam.name = translate('blockDataviewCreateNewSet');
			addParam.onClick = (details: any) => {
				C.ObjectCreateSet([], details, '', commonStore.space, message => onSelect(message.details, true));
			};
		};

		const onSelect = (item: any, isNew: boolean) => {
			C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id, (message: any) => {
				const button = $(this.node).find('#head-source-select');

				if (!isCollection && isNew && button.length) {
					button.trigger('click');
				};

				if (message.views && message.views.length) {
					window.setTimeout(() => this.loadData(message.views[0].id, 0, true), 50);
				};

				if (isNew && this.refControls && this.refControls.refHead) {
					const ref = this.refControls.refHead;
					const l = String(item.name || '').length;

					ref.setValue(item.name);
					ref.setRange({ from: l, to: l });
					ref.setEditing(true);
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

		menuStore.open('searchObject', Object.assign({
			element: $(element),
			className: 'single',
			data: {
				rootId,
				blockId: block.id,
				blockIds: [ block.id ],
				value: [ targetObjectId ],
				canAdd: true,
				filters,
				addParam,
				onSelect,
			}
		}, param || {}));
	};

	onSourceTypeSelect (obj: any) {
		const { rootId, block } = this.props;
		const objectId = this.getObjectId();
		const element = $(obj);

		menuStore.closeAll(null, () => {
			menuStore.open('dataviewSource', {
				element,
				horizontal: I.MenuDirection.Center,
				onOpen: () => { 
					element.addClass('active');
				}, 
				onClose: () => {
					element.removeClass('active');
				}, 
				data: {
					rootId,
					objectId,
					blockId: block.id,
				}
			});
		});
	};

	onDragRecordStart (e: any, recordId: string) {
		e.stopPropagation();

		const { dataset, block } = this.props;
		const { selection, onDragStart } = dataset || {};
		const record = this.getRecord(recordId);

		let ids = selection.get(I.SelectType.Record);
		if (!ids.length) {
			ids = [ record.id ];
		};

		keyboard.setSelectionClearDisabled(false);

		if (!selection || !onDragStart) {
			return;
		};

		if (!block.isDraggable()) {
			e.preventDefault();
			return;
		};

		keyboard.disableSelection(true);

		onDragStart(e, I.DropType.Record, ids, this);
	};

	onRecordDrop (targetId: string, ids: string[]) {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const subId = this.getSubId();
		const view = this.getView();

		if (!ids.length) {
			return;
		};

		if (selection) {
			selection.clear();
		};

		let records = this.getRecords();
		if (records.indexOf(targetId) > records.indexOf(ids[0])) {
			ids = ids.reverse();
		};

		ids.forEach(id => {
			const oldIndex = records.indexOf(id);
			const targetIndex = records.indexOf(targetId);

			records = arrayMove(records, oldIndex, targetIndex);
		});

		dbStore.recordsSet(subId, '', records);
		this.objectOrderUpdate([ { viewId: view.id, groupId: '', objectIds: records } ], records);
	};

	getIdPrefix () {
		return [ 'dataviewCell', this.props.block.id ].join('-');
	};

	getVisibleRelations () {
		const { rootId, block } = this.props;
		const view = this.getView();

		if (!view) {
			return [];
		};

		const keys = dbStore.getObjectRelationKeys(rootId, block.id);
		return view.getVisibleRelations().filter(it => keys.includes(it.relationKey));
	};

	getEmpty (type: string) {
		const { isInline, block } = this.props;
		const isCollection = this.isCollection();
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
					description: UtilCommon.sprintf(translate('blockDataviewEmptyTargetDescription'), name),
					button: translate('blockDataviewEmptyTargetButton'),
					onClick: () => this.onSourceSelect(`#block-${block.id} .dataviewEmpty .button`, {}),
				};
				break;
			};

			case 'source': {
				emptyProps = {
					title: translate('blockDataviewEmptySourceTitle'),
					description: translate('blockDataviewEmptySourceDescription'),
					button: translate('blockDataviewEmptySourceButton'),
					onClick: this.onEmpty,
				};
				break;
			};

			case 'view': {
				cn.push('withHead');

				emptyProps.title = translate('commonNoObjects');

				if (this.isAllowedObject()) {
					emptyProps.description = translate('blockDataviewEmptyViewDescription');
					emptyProps.button = translate('blockDataviewEmptyViewButton');
					emptyProps.onClick = e => this.onRecordAdd(e, 1, '', { horizontal: I.MenuDirection.Center });
				};
				break;
			};
		};

		return (
			<Empty
				{...this.props}
				{...emptyProps}
				className={cn.join(' ')}
				withButton={emptyProps.button ? true : false}
			/>
		);
	};

	isAllowedObject () {
		const { rootId, block, readonly } = this.props;

		let isAllowed = !readonly && blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		if (!isAllowed) {
			return false;
		};

		if (isAllowed && this.isCollection()) {
			return true;
		};

		const sources = this.getSources();
		if (!sources.length) {
			return false;
		};

		const targetId = this.getObjectId();
		const types = Relation.getSetOfObjects(rootId, targetId, I.ObjectLayout.Type);
		const skipLayouts = [ I.ObjectLayout.Participant ].concat(UtilObject.getFileAndSystemLayouts());

		for (const type of types) {
			if (skipLayouts.includes(type.recommendedLayout)) {
				isAllowed = false;
				break;
			};
		};

		return isAllowed;
	};

	isAllowedDefaultType (): boolean {
		if (this.isCollection()) {
			return true;
		};

		const { rootId } = this.props;
		return !!Relation.getSetOfObjects(rootId, this.getTarget().id, I.ObjectLayout.Relation).map(it => it.id).length;
	};

	isCollection (): boolean {
		const { rootId, block } = this.props;
		return Dataview.isCollection(rootId, block.id);
	};

	objectOrderUpdate (orders: any[], records: any[], callBack?: (message0: any) => void) {
		const { rootId, block } = this.props;
		const view = this.getView();

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

				window.setTimeout(() => this.applyObjectOrder(it.groupId, records), 30);
			});

			if (callBack) {
				callBack(message);
			};
		});
	};

	applyObjectOrder (groupId: string, records: any[]): string[] {
		const { rootId, block } = this.props;
		if (!block) {
			return [];
		};

		const view = this.getView();
		if (!view) {
			return [];
		};

		return Dataview.applyObjectOrder(rootId, block.id, view.id, groupId, records);
	};

	onSelectToggle (e: React.MouseEvent, id: string) {
		e.preventDefault();
		e.stopPropagation();

		const { dataset, isInline } = this.props;
		const { selection } = dataset || {};

		if (!selection || isInline) {
			return;
		};

		let ids = selection.get(I.SelectType.Record);
		ids = ids.includes(id) ? ids.filter(it => it != id) : ids.concat([ id ]);
		selection.set(I.SelectType.Record, ids);

		this.setSelected(ids);
		this.selectionCheck();
	};

	selectionCheck () {
		const { dataset } = this.props;
		const { selection } = dataset || {};
		const node = $(this.node);
		const con = node.find('#dataviewControls');
		const sel = node.find('#dataviewSelection');
		const ids = selection.get(I.SelectType.Record);
		const length = ids.length;

		length ? con.hide() : con.show();
		length ? sel.show() : sel.hide();
	};

	onSelectEnd () {
		const { dataset, isInline, readonly } = this.props;
		const { selection } = dataset || {};

		if (!selection || isInline || readonly) {
			return;
		};

		const ids = selection.get(I.SelectType.Record);

		this.setSelected(ids);
		this.selectionCheck();
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			if (this.filter == v) {
				return;
			};

			this.filter = v;

			if (v) {
				UtilData.search({
					filters: [],
					sorts: [],
					fullText: v,
					keys: [ 'id' ],
				}, (message: any) => {
					this.searchIds = (message.records || []).map(it => it.id);
					this.reloadData();
				});
			} else {
				this.searchIds = null;
				this.reloadData();
			};

			analytics.event('ScreenSearchDataview', { route: this.analyticsRoute() });
		}, Constant.delay.keyboard);
	};

	setSelected (ids: string[]) {
		if (this.refSelect) {
			this.refSelect.setIds(ids);
		};
	};

	multiSelectAction (id: string) {
		const { dataset, isInline } = this.props;
		const { selection } = dataset || {};

		if (!selection || isInline) {
			return;
		};

		const objectId = this.getObjectId();
		const ids = selection.get(I.SelectType.Record);
		const count = ids.length;

		switch (id) {
			case 'archive': {
				Action.archive(ids);
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

	getSearchIds () {
		return this.searchIds;
	};

	analyticsRoute () {
		return this.isCollection() ? analytics.route.collection : analytics.route.set;
	};

	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
			const { block, getWrapperWidth } = this.props;

			if (getWrapperWidth) {
				const node = $(this.node);
				const obj = $(`#block-${block.id}`);

				node.width() <= getWrapperWidth() / 2 ? obj.addClass('isVertical') : obj.removeClass('isVertical');
			};

			if (this.refControls && this.refControls.resize) {
				this.refControls.resize();
			};

			if (this.refView && this.refView.resize) {
				this.refView.resize();
			};
		});
	};

});

export default BlockDataview;

import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { set } from 'mobx';
import { I, C, S, U, J, analytics, Dataview, keyboard, Onboarding, Relation, focus, translate, Action } from 'Lib';

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
		this.getSubId = this.getSubId.bind(this);
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
		this.onSortAdd = this.onSortAdd.bind(this);
		this.onFilterAdd = this.onFilterAdd.bind(this);

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
		const views = S.Record.getViews(rootId, block.id);

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
		const cn = [ 'focusable', `c${block.id}` ];

		const { groupRelationKey, pageLimit, defaultTemplateId } = view;
		const className = [ U.Common.toCamelCase(`view-${I.ViewType[view.type]}`) ];

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
			getSubId: this.getSubId,
			onRecordAdd: this.onRecordAdd,
			onTemplateMenu: this.onTemplateMenu,
			onTemplateAdd: this.onTemplateAdd,
			onSortAdd: this.onSortAdd,
			onFilterAdd: this.onFilterAdd,
			isAllowedObject: this.isAllowedObject,
			isAllowedDefaultType: this.isAllowedDefaultType,
			onSourceSelect: this.onSourceSelect,
			onSourceTypeSelect: this.onSourceTypeSelect,
			onViewSettings: () => {
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
						pageContainer={U.Common.getCellContainer(isPopup ? 'popup' : 'page')}
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
		const { block, isInline, isPopup } = this.props;
		const match = keyboard.getMatch(isPopup);
		const subId = this.getSubId();
		const isCollection = this.isCollection();
		const viewId = match.params.viewId || block.content.viewId;
		const object = this.getTarget();

		if (viewId) {
			S.Record.metaSet(subId, '', { viewId });
		};

		this.reloadData(() => {
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
					this.isAllowedObject() && 
					this.isAllowedDefaultType() && 
					total
				) {
					Onboarding.start('setSettings', isPopup);
				};
			}, J.Constant.delay.menu);
		});

		this.init();
		this.resize();
		this.rebind();

		if (!U.Object.isTypeLayout(object.layout)) {
			const view = this.getView();
			const eventName = this.isCollection() ? 'ScreenCollection' : 'ScreenSet';

			analytics.event(eventName, { embedType: analytics.embedType(isInline), type: view?.type });
		};
	};

	componentDidUpdate () {
		const { viewId } = S.Record.getMeta(this.getSubId(), '');

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

		head.toggleClass('isDeleted', object.isDeleted);
	};

	unbind () {
		const { isPopup, block } = this.props;
		const events = [ 'resize', 'sidebarResize', 'updateDataviewData', 'setDataviewSource', 'selectionEnd', 'selectionClear', 'selectionSet' ];
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		$(window).off(events.map(it => `${it}.${ns}`).join(' '));
	};

	rebind () {
		const { isPopup, block } = this.props;
		const win = $(window);
		const ns = block.id + U.Common.getEventNamespace(isPopup);

		this.unbind();

		win.on(`resize.${ns} sidebarResize.${ns}`, () => this.resize());
		win.on(`updateDataviewData.${ns}`, () => this.loadData(this.getView().id, 0, true));
		win.on(`setDataviewSource.${ns}`, () => this.onSourceSelect(`#block-head-${block.id} #value`, { offsetY: 36 }));
		win.on(`selectionEnd.${ns} selectionClear.${ns} selectionSet.${ns}`, () => this.onSelectEnd());
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
		if (this.props.isInline) {
			focus.set(this.props.block.id, { from: 0, to: 0 });
		};
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
			S.Record.recordsSet(subId, '', []);
		};

		S.Record.metaSet(subId, '', { offset, viewId });

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
				filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: this.searchIds || [] });
			};

			Dataview.getData({
				rootId, 
				subId,
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

	reloadData (cb?: () => void) {
		const view = this.getView();

		if (view) {
			S.Record.metaSet(this.getSubId(), '', { viewId: view.id, offset: 0, total: 0 });
			this.loadData(view.id, 0, true, () => {
				if (cb) {
					cb();
				};
			});
		};
	};

	getObjectId (): string {
		const { rootId, block, isInline } = this.props;

		let ret = block.getTargetObjectId();
		if (!isInline && !ret) {
			ret = rootId;
		};

		return ret;
	};

	getKeys (id: string): string[] {
		const view = this.getView(id);

		let keys = J.Relation.default.concat(J.Relation.cover);
		if (view) {
			keys = keys.concat((view.relations || []).map(it => it && it.relationKey));

			if (view.coverRelationKey && (view.coverRelationKey != J.Relation.pageCover)) {
				keys.push(view.coverRelationKey);
			};

			if (view.groupRelationKey) {
				keys.push(view.groupRelationKey);
			};
		};

		return U.Common.arrayUnique(keys);
	};

	getLimit (type: I.ViewType): number {
		const { isInline } = this.props;
		const view = this.getView();
		const options = Relation.getPageLimitOptions(view.type, isInline);
		const pageLimit = Number(view.pageLimit) || options[0].id;

		let limit = 0;

		switch (type) {
			default: {
				limit = isInline ? pageLimit : 0;
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

	getSubId (groupId?: string): string {
		const { rootId, block } = this.props;

		let ret = '';
		if (groupId) {
			ret = S.Record.getGroupSubId(rootId, block.id, groupId);
		} else {
			ret = S.Record.getSubId(rootId, block.id);
		};
		return ret;
	};

	getRecords (groupId?: string): string[] {
		const subId = this.getSubId(groupId);
		const records = S.Record.getRecordIds(subId, '');

		return this.applyObjectOrder('', U.Common.objectCopy(records));
	};

	getRecord (id: string) {
		const view = this.getView();
		if (!view) {
			return {};
		};

		const skip = [ 'restrictions' ];
		const keys = this.getKeys(view.id).filter(it => !skip.includes(it));
		const subId = this.getSubId();
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
		const { rootId } = this.props;
		const targeId = this.getObjectId();

		return S.Detail.get(rootId, targeId, [ 'setOf' ]);
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
				const { ww, wh } = U.Common.getWindowDimensions();
				return { x: ww / 2, y: wh / 2, width: 200, height: 0 };
			};
		};

		return menuParam;
	};

	getDefaultTemplateId (typeId?: string): string {
		const view = this.getView();
		const type = S.Record.getTypeById(typeId || this.getTypeId());

		if (view && view.defaultTemplateId) {
			return view.defaultTemplateId;
		} else
		if (type && type.defaultTemplateId) {
			return type.defaultTemplateId;
		};
		return '';
	};

	recordCreate (e: any, template: any, dir: number, groupId?: string, idx?: number) {
		const { rootId } = this.props;
		const objectId = this.getObjectId();
		const subId = this.getSubId(groupId);
		const isCollection = this.isCollection();
		const view = this.getView();

		if (!view || this.creating) {
			return;
		};

		const details = this.getDetails(groupId);
		const flags: I.ObjectFlag[] = [ I.ObjectFlag.SelectTemplate ];
		const isViewGraph = view.type == I.ViewType.Graph;
		const isViewCalendar = view.type == I.ViewType.Calendar;
		
		let typeId = '';
		let templateId = '';

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

		const type = S.Record.getTypeById(typeId);
		if (!type) {
			console.error('[BlockDataview.recordCreate] No type');
			return;
		};

		const templateObject = S.Detail.get(rootId, templateId);
		if (templateObject.isArchived || templateObject.isDeleted) {
			templateId = '';
		};

		this.creating = true;

		C.ObjectCreate(details, flags, templateId, type.uniqueKey, S.Common.space, true, (message: any) => {
			this.creating = false;

			if (message.error.code) {
				return;
			};

			let records = this.getRecords(groupId);

			const object = message.details;
			const oldIndex = records.indexOf(message.objectId);

			S.Detail.update(subId, { id: object.id, details: object }, true);

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

			if (isCollection) {
				C.ObjectCollectionAdd(objectId, [ object.id ]);
			};

			if (groupId) {
				this.objectOrderUpdate([ { viewId: view.id, groupId, objectIds: records } ], records, () => S.Record.recordsSet(subId, '', records));
			} else {
				S.Record.recordsSet(subId, '', records);
			};

			if (isViewGraph) {
				const refGraph = this.refView?.refGraph;
				if (refGraph) {
					refGraph.addNewNode(object.id, '', null, () => {
						$(window).trigger('updateGraphRoot', { id: object.id });
					});
				};
			};

			if (isViewGraph || isViewCalendar) {
				U.Object.openConfig(object);
			} else {
				if (U.Object.isNoteLayout(object.layout)) {
					this.onCellClick(e, 'name', object.id);
				} else {
					window.setTimeout(() => {
						const id = Relation.cellId(this.getIdPrefix(), 'name', object.id);
						const ref = this.refCells.get(id);

						if (ref) {
							ref.onClick(e);
						};
					}, 15);
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

	onRecordAdd (e: any, dir: number, groupId?: string, menuParam?: any, idx?: number) {
		if (e.persist) {
			e.persist();
		};

		const typeId = this.getTypeId();
		const type = S.Record.getTypeById(typeId);
		const view = this.getView();

		if ((view.type == I.ViewType.Board) && !groupId) {
			groupId = 'empty';
		};

		if (type && U.Object.isBookmarkLayout(type.recommendedLayout)) {
			this.onBookmarkMenu(e, dir, groupId, menuParam);
		} else {
			this.recordCreate(e, { id: this.getDefaultTemplateId() }, dir, groupId, idx);
		};
	};

	onBookmarkMenu (e: any, dir: number, groupId?: string, param?: any) {
		param = param || {};

		const objectId = this.getObjectId();
		const details = this.getDetails(groupId);
		const menuParam = this.getMenuParam(e, dir);

		S.Menu.open('dataviewCreateBookmark', {
			...menuParam,
			type: I.MenuType.Horizontal,
			vertical: dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom,
			horizontal: dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right,
			offsetX: dir < 0 ? -24 : 0,
			offsetY: 4 * -dir,
			data: {
				route: analytics.route.type,
				details,
				onSubmit: (bookmark) => {
					if (this.isCollection()) {
						C.ObjectCollectionAdd(objectId, [ bookmark.id ]);
					};
				},
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

		S.Menu.open('dataviewNew', {
			...menuParam,
			offsetY: 10,
			noAnimation: true,
			subIds: J.Menu.dataviewTemplate.concat([ 'dataviewTemplateContext' ]),
			vertical: dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom,
			horizontal: dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right,
			onOpen: context => {
				menuContext = context;
				this.refControls?.toggleHoverArea(true);
			},
			onClose: () => {
				menuContext = null;
				this.refControls?.toggleHoverArea(false);
			},
			data: {
				blockId: block.id,
				subId: this.getSubId(),
				targetId: this.getObjectId(),
				hasSources,
				getView: this.getView,
				withTypeSelect: this.isAllowedDefaultType(),
				typeId,
				templateId: this.getDefaultTemplateId(),
				route,
				isAllowedObject: this.isAllowedObject(),
				isCollection,
				onTypeChange: (id) => {
					if (id != this.getTypeId()) {
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

					const typeId = this.getTypeId();
					const type = S.Record.getTypeById(typeId);

					if (U.Object.isBookmarkLayout(type.recommendedLayout)) {
						menuContext?.close();
						this.onBookmarkMenu(e, dir, '', { element: `#button-${block.id}-add-record` });
					} else
					if (item.id == J.Constant.templateId.new) {
						this.onTemplateAdd(item.targetObjectType);
					} else {
						this.recordCreate(e, item, dir);
						Dataview.viewUpdate(rootId, block.id, view.id, { defaultTemplateId: item.id });

						menuContext?.close();
						analytics.event('ChangeDefaultTemplate', { route });
					};
				},
			}
		});
	};

	onTemplateAdd (id?: string) {
		const typeId = id || this.getTypeId();
		const type = S.Record.getTypeById(typeId);
		const details: any = {
			targetObjectType: typeId,
			layout: type.recommendedLayout,
		};

		C.ObjectCreate(details, [], '', J.Constant.typeKey.template, S.Common.space, true, (message) => {
			if (message.error.code) {
				return;
			};

			const object = message.details;

			focus.clear(true);
			analytics.event('CreateTemplate', { objectType: typeId, route: this.analyticsRoute() });

			U.Object.openConfig(object);
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
		if (U.Object.isNoteLayout(record.layout) && (relation.relationKey == 'name')) {
			return false;
		};
		return true;
	};

	onCellClick (e: any, relationKey: string, recordId: string, record?: any) {
		if (e.button) {
			return;
		};

		if (!record) {
			record = this.getRecord(recordId);
		};

		const selection = S.Common.getRef('selectionProvider');
		const relation = S.Record.getRelationByKey(relationKey);
		const id = Relation.cellId(this.getIdPrefix(), relationKey, record.id);
		const ref = this.refCells.get(id);
		const view = this.getView();

		if (!relation || !ref || !record) {
			return;
		};

		if (!view.isGrid() && Relation.isUrl(relation.format)) {
			Action.openUrl(Relation.checkUrlScheme(relation.format, record[relationKey]));
			return;
		};

		if ((relationKey == 'name') && ref.isEditing && !ref.isEditing()) {
			const ids = selection?.get(I.SelectType.Record) || [];

			if (keyboard.withCommand(e)) {
				if (!ids.length) {
					U.Object.openEvent(e, record);
				};
			} else {
				U.Object.openConfig(record);
			};
		} else {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const subId = this.getSubId();
		const relation = S.Record.getRelationByKey(relationKey);
		const record = this.getRecord(id);

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

	onContext (e: any, id: string, subId?: string): void {
		e.preventDefault();
		e.stopPropagation();

		subId = subId || this.getSubId();

		const { block } = this.props;
		const selection = S.Common.getRef('selectionProvider');
		const isCollection = this.isCollection();
		const view = this.getView();

		if (!view) {
			return;
		};
		
		let objectIds = selection?.get(I.SelectType.Record) || [];
		if (!objectIds.length) {
			objectIds = [ id ];
		};

		S.Menu.open('objectContext', {
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			onClose: () => selection.clear(),
			data: {
				blockId: block.id,
				targetId: this.getObjectId(),
				objectIds,
				subId,
				isCollection,
				route: this.analyticsRoute(),
				relationKeys: this.getVisibleRelations().map(it => it.relationKey),
				view,
				allowedLinkTo: true,
				allowedOpen: true,
				allowedRelation: true,
			}
		});
	};

	onSourceSelect (element: any, param: Partial<I.MenuParam>) {
		const { rootId, block, isPopup, isInline } = this.props;
		const { targetObjectId } = block.content;
		const isCollection = this.isCollection();
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
				C.ObjectCreate(details, [], '', collectionType?.uniqueKey, S.Common.space, true, message => onSelect(message.details, true));
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

		S.Menu.open('searchObject', Object.assign({
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
				withPlural: true,
			}
		}, param || {}));
	};

	onSourceTypeSelect (obj: any) {
		const { rootId, block } = this.props;
		const objectId = this.getObjectId();
		const element = $(obj);

		S.Menu.closeAll(null, () => {
			S.Menu.open('dataviewSource', {
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

	onDragRecordStart (e: any, recordId: string) {
		e.stopPropagation();

		const { block } = this.props;
		const dragProvider = S.Common.getRef('dragProvider');
		const selection = S.Common.getRef('selectionProvider');
		const record = this.getRecord(recordId);
		const ids = selection?.get(I.SelectType.Record) || [];

		if (!ids.length) {
			ids.push(record.id);
		};

		keyboard.setSelectionClearDisabled(false);

		if (!block.isDraggable()) {
			e.preventDefault();
			return;
		};

		keyboard.disableSelection(true);
		dragProvider?.onDragStart(e, I.DropType.Record, ids, this);
	};

	onRecordDrop (targetId: string, ids: string[]) {
		const selection = S.Common.getRef('selectionProvider');
		const subId = this.getSubId();
		const view = this.getView();

		if (!ids.length) {
			return;
		};

		selection?.clear();

		let records = this.getRecords();
		if (records.indexOf(targetId) > records.indexOf(ids[0])) {
			ids = ids.reverse();
		};

		ids.forEach(id => {
			const oldIndex = records.indexOf(id);
			const targetIndex = records.indexOf(targetId);

			records = arrayMove(records, oldIndex, targetIndex);
		});

		S.Record.recordsSet(subId, '', records);
		this.objectOrderUpdate([ { viewId: view.id, groupId: '', objectIds: records } ], records);
	};

	onSortAdd (item: any, callBack?: () => void) {
		const { rootId, block, isInline } = this.props;
		const view = this.getView();
		const object = this.getTarget();

		C.BlockDataviewSortAdd(rootId, block.id, view.id, item, () => {
			if (callBack) {
				callBack();
			};

			analytics.event('AddSort', {
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
	};

	onFilterAdd (item: any, callBack?: () => void) {
		const { rootId, block, isInline } = this.props;
		const view = this.getView();
		const object = this.getTarget();

		C.BlockDataviewFilterAdd(rootId, block.id, view.id, item, () => {
			if (callBack) {
				callBack();
			};

			analytics.event('AddFilter', {
				condition: item.condition,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});
		});
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

		const keys = S.Record.getDataviewRelationKeys(rootId, block.id);
		return view.getVisibleRelations().filter(it => keys.includes(it.relationKey));
	};

	getEmpty (type: string) {
		const { isInline, block, readonly } = this.props;
		const isCollection = this.isCollection();
		const view = this.getView();
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
					description: U.Common.sprintf(translate('blockDataviewEmptyTargetDescription'), name),
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
				if (view.type != I.ViewType.Grid) {
					cn.push('withHead');
				};

				emptyProps.title = translate('commonNoObjects');

				if (this.isAllowedObject()) {
					emptyProps.description = translate('blockDataviewEmptyViewDescription');
					emptyProps.button = translate('commonCreateObject');
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
				withButton={emptyProps.button && !readonly ? true : false}
			/>
		);
	};

	isAllowedObject () {
		const { rootId, block, readonly } = this.props;
		const root = S.Block.getLeaf(rootId, rootId);

		if (root && root.isLocked()) {
			return false;
		};

		let isAllowed = !readonly && S.Block.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
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

		const { isInline } = this.props;
		const selection = S.Common.getRef('selectionProvider');

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
		const selection = S.Common.getRef('selectionProvider');
		const node = $(this.node);
		const con = node.find('#dataviewControls');
		const sel = node.find('#dataviewSelection');
		const ids = selection?.get(I.SelectType.Record) || [];
		const length = ids.length;

		length ? con.hide() : con.show();
		length ? sel.show() : sel.hide();
	};

	onSelectEnd () {
		const { isInline, readonly } = this.props;
		const selection = S.Common.getRef('selectionProvider');

		if (!selection || isInline || readonly) {
			return;
		};

		this.setSelected(selection.get(I.SelectType.Record));
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
				U.Data.search({
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
		}, J.Constant.delay.keyboard);
	};

	setSelected (ids: string[]) {
		this.refSelect?.setIds(ids);
	};

	multiSelectAction (id: string) {
		const { isInline } = this.props;
		const selection = S.Common.getRef('selectionProvider');

		if (!selection || isInline) {
			return;
		};

		const objectId = this.getObjectId();
		const ids = selection.get(I.SelectType.Record);
		const count = ids.length;

		switch (id) {
			case 'archive': {
				Action.archive(ids, this.analyticsRoute());
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

				obj.toggleClass('isVertical', node.width() <= getWrapperWidth() / 2);
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

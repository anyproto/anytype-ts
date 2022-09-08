import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, C, Util, DataUtil, analytics, Dataview, keyboard, Onboarding, Relation, Renderer } from 'Lib';
import { observer } from 'mobx-react';
import { blockStore, menuStore, dbStore, detailStore, popupStore } from 'Store';
import { throttle } from 'lodash';
import arrayMove from 'array-move';

import Controls from './dataview/controls';

import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';
import ViewList from './dataview/view/list';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};

const $ = require('jquery');
const Constant = require('json/constant.json');

const BlockDataview = observer(class BlockDataview extends React.Component<Props, {}> {

	viewRef: any = null;
	cellRefs: Map<string, any> = new Map();
	viewId: string = '';
	creating: boolean = false;

	constructor (props: any) {
		super(props);
		
		this.getData = this.getData.bind(this);
		this.getRecord = this.getRecord.bind(this);
		this.getView = this.getView.bind(this);
		this.getKeys = this.getKeys.bind(this);
		this.onRecordAdd = this.onRecordAdd.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.onContext = this.onContext.bind(this);
	};

	render () {
		const { rootId, block, isPopup } = this.props;
		const views = dbStore.getViews(rootId, block.id);

		if (!views.length) {
			return null;
		};

		const view = this.getView();
		if (!view) {
			return null;
		};

		let { groupRelationKey } = view;
		let ViewComponent: any = null;
		let className = '';

		switch (view.type) {
			default:
			case I.ViewType.Grid:
				ViewComponent = ViewGrid;
				className = 'viewGrid';
				break;
				
			case I.ViewType.Board:
				ViewComponent = ViewBoard;
				className = 'viewBoard';
				break;
				
			case I.ViewType.Gallery:
				ViewComponent = ViewGallery;
				className = 'viewGallery';
				break;
			
			case I.ViewType.List:
				ViewComponent = ViewList;
				className = 'viewList';
				break;
		};

		return (
			<div>
				<Controls 
					{...this.props} 
					className={className}
					readonly={false} 
					getData={this.getData} 
					getView={this.getView} 
					getRecord={this.getRecord}
					onRecordAdd={this.onRecordAdd}
				/>
				<div className="content">
					<ViewComponent 
						key={'view' + view.id}
						ref={(ref: any) => { this.viewRef = ref; }} 
						onRef={(ref: any, id: string) => { this.cellRefs.set(id, ref); }} 
						{...this.props} 
						bodyContainer={Util.getBodyContainer(isPopup ? 'popup' : 'page')}
						pageContainer={Util.getCellContainer(isPopup ? 'popup' : 'page')}
						readonly={false} 
						getData={this.getData} 
						getRecord={this.getRecord}
						getView={this.getView} 
						getKeys={this.getKeys}
						onRecordAdd={this.onRecordAdd}
						onCellClick={this.onCellClick}
						onCellChange={this.onCellChange}
						onContext={this.onContext}
					/>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { rootId, block, isPopup } = this.props;
		const view = this.getView();
		const root = blockStore.getLeaf(rootId, rootId);

		if (view) {
			dbStore.metaSet(rootId, block.id, { viewId: view.id, offset: 0, total: 0 });
			this.getData(view.id, 0);
		};

		if (root.isObjectSet()) {
			Onboarding.start('set', isPopup);
		};

		this.resize();
		this.rebind();
	};

	componentDidUpdate () {
		const { rootId, block } = this.props;
		const { viewId } = dbStore.getMeta(dbStore.getSubId(rootId, block.id), '');

		if (viewId != this.viewId) {
			this.getData(viewId, 0);
		};

		this.resize();
		this.rebind();

		$(window).trigger('resize.editor');
	};

	componentWillUnmount () {
		this.unbind();
	};

	unbind () {
		const { block } = this.props;
		$(window).off(`resize.${block.id} keydown.${block.id}`);
	};

	rebind () {
		const { block } = this.props;
		const win = $(window);

		this.unbind();
		win.on(`resize.${block.id}`, throttle((e: any) => { this.resize(); }, 20));
		win.on(`keydown.${block.id}`, throttle((e: any) => { this.onKeyDown(e); }, 100));
	};

	onKeyDown (e: any) {
		const { rootId, dataset } = this.props;
		const { selection } = dataset || {};
		const root = blockStore.getLeaf(rootId, rootId);
		const cmd = keyboard.ctrlKey();
		const ids = selection ? selection.get(I.SelectType.Block) : [];
		const length = ids.length;

		if (!root || (!root.isObjectSet() && !root.isObjectSpace())) {
			return;
		};

		if (!this.creating) {
			keyboard.shortcut(`${cmd}+n`, e, (pressed: string) => { this.onRecordAdd(e, -1, true); });
		};

		if (length) {
			keyboard.shortcut('backspace, delete', e, (pressed: string) => {
				C.ObjectListSetIsArchived(ids, true);
				
				selection.clear();
				analytics.event('MoveToBin', { count: length });
			});
		};
	};

	getKeys (id: string): string[] {
		const view = this.getView(id);

		let keys = Constant.defaultRelationKeys.concat(Constant.coverRelationKeys);
		if (view) {
			keys = keys.concat((view.relations || []).map(it => it.relationKey));

			if (view.coverRelationKey) {
				keys.push(view.coverRelationKey);
			};

			if (view.groupRelationKey) {
				keys.push(view.groupRelationKey);
			};
		};

		return Util.arrayUnique(keys);
	};

	getData (newViewId: string, offset: number, callBack?: (message: any) => void) {
		if (!newViewId) {
			return;
		};

		this.viewId = newViewId;

		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		const view = this.getView(newViewId);
		const keys = this.getKeys(newViewId);

		let limit = 0;
		if ([ I.ViewType.Grid, I.ViewType.List ].includes(view.type)) {
			limit = Constant.limit.dataview.records + offset;
			offset = 0;
		};

		dbStore.recordsSet(subId, '', []);
		dbStore.metaSet(subId, '', { offset: offset, viewId: newViewId });

		if (![ I.ViewType.Board ].includes(view.type)) {
			Dataview.getData(rootId, block.id, newViewId, keys, 0, 0, false, callBack);
		} else 
		if (this.viewRef.loadGroupList) {
			this.viewRef.loadGroupList();
		};
	};

	getRecord (index: number) {
		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		const records = dbStore.getRecords(subId, '');

		if (index > records.length - 1) {
			return {};
		};

		const item = detailStore.get(subId, records[index]);

		let name = String(item.name || '');
		let isReadonly = Boolean(item.isReadonly);

		if (name == DataUtil.defaultName('page')) {
			name = '';
		};

		if (item.layout == I.ObjectLayout.Note) {
			name = String(item.snippet || '').replace(/\n/g, ' ');
		};
		if (item.isDeleted) {
			isReadonly = true;
		};

		return {
			...item,
			name,
			isReadonly,
		};
	};

	getView (viewId?: string) {
		const { rootId, block } = this.props;
		const views = dbStore.getViews(rootId, block.id);

		if (!views.length) {
			return null;
		};

		viewId = viewId || dbStore.getMeta(dbStore.getSubId(rootId, block.id), '').viewId;
		return dbStore.getView(rootId, block.id, viewId) || views[0];
	};

	onRecordAdd (e: any, dir: number, withPopup?: boolean) {
		if (e.persist) {
			e.persist();
		};

		const { rootId, block } = this.props;
		const object = detailStore.get(rootId, rootId, [ 'setOf' ], true);
		const setOf = object.setOf || [];
		const element = $(e.currentTarget);
		const view = this.getView();
		const subId = dbStore.getSubId(rootId, block.id);
		const conditions = [
			I.FilterCondition.Equal,
			I.FilterCondition.In,
			I.FilterCondition.AllIn,
		]; 

		const types = Relation.getSetOfObjects(rootId, rootId, Constant.typeId.type);
		const relations = Relation.getSetOfObjects(rootId, rootId, Constant.typeId.relation);
		const details: any = {};

		if (types.length) {
			details.type = types[0].id
		};

		if (relations.length) {
			relations.forEach((it: any) => {
				details[it.id] = Relation.formatValue(it, null, true);
			});
		};

		for (let filter of view.filters) {
			if (!conditions.includes(filter.condition) || !filter.value) {
				continue;
			};
			
			const relation = dbStore.getRelationByKey(filter.relationKey);
			if (!relation || relation.isReadonlyValue) {
				continue;
			};

			details[filter.relationKey] = Relation.formatValue(relation, filter.value, true);
		};

		this.creating = true;

		const create = (template: any) => {
			C.ObjectCreate(details, [], template?.id, (message: any) => {
				this.creating = false;

				if (message.error.code) {
					return;
				};

				const records = dbStore.getRecords(subId, '');
				const object = detailStore.get(subId, message.objectId, []);
				const oldIndex = records.findIndex(it => it == object.id);
				const newIndex = dir > 0 ? records.length - 1 : 0;

				if (oldIndex < 0) {
					dbStore.recordAdd (subId, '', object.id, dir);
				} else {
					dbStore.recordsSet(subId, '', arrayMove(records, oldIndex, newIndex));
				};

				const id = Relation.cellId('dataviewCell', 'name', newIndex);
				const ref = this.cellRefs.get(id);

				if (ref && (view.type == I.ViewType.Grid)) {
					window.setTimeout(() => { ref.onClick(e); }, 15);
				};

				analytics.event('CreateObject', {
					route: 'Set',
					objectType: object.type,
					layout: object.layout,
					template: template ? (template.templateIsBundled ? template.id : 'custom') : '',
				});
			});
		};

		if (!setOf.length) {
			create(null);
			return;
		};

		const first = setOf[0];

		if (first == Constant.typeId.bookmark) {
			menuStore.open('dataviewCreateBookmark', {
				type: I.MenuType.Horizontal,
				element,
				vertical: dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom,
				horizontal: dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right,
				data: {
					command: (source: string, callBack: (message: any) => void) => {
						C.ObjectCreateBookmark({ source }, callBack);
					}
				},
			});
			return;
		};

		const showPopup = () => {
			popupStore.open('template', { data: { typeId: first, onSelect: create } });
		};

		const showMenu = () => {
			menuStore.open('searchObject', {
				element: element,
				className: 'single',
				subIds: [ 'previewObject' ],
				vertical: dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom,
				horizontal: dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right,
				data: {
					label: 'Choose a template',
					noFilter: true,
					noIcon: true,
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.template },
						{ operator: I.FilterOperator.And, relationKey: 'targetObjectType', condition: I.FilterCondition.In, value: setOf },
						{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
					],
					sorts: [
						{ relationKey: 'name', type: I.SortType.Asc },
					],
					onOver: (e: any, context: any, item: any) => {
						menuStore.open('previewObject', {
							element: `#${context.props.getId()} #item-${item.id}`,
							offsetX: context.props.getSize().width,
							isSub: true,
							vertical: I.MenuDirection.Center,
							data: { rootId: item.id }
						});
					},
					onSelect: (item: any) => {
						create(item);

						window.setTimeout(() => { menuStore.close('previewObject'); }, Constant.delay.menu);
					},
				}
			});
		};

		DataUtil.checkTemplateCnt(setOf, (message: any) => {
			if (message.records.length > 1) {
				withPopup ? showPopup() : showMenu();
			} else {
				create(message.records.length ? message.records[0] : '');
			};
		});
	};

	onCellClick (e: any, relationKey: string, index: number) {
		if (e.button) {
			return;
		};

		const { dataset } = this.props;
		const { selection } = dataset || {};
		const relation = dbStore.getRelationByKey(relationKey);
		const id = Relation.cellId('dataviewCell', relationKey, index);
		const ref = this.cellRefs.get(id);
		const record = this.getRecord(index);
		const view = this.getView();

		if (!relation || !ref || !record) {
			return;
		};

		if ([ I.ViewType.List, I.ViewType.Gallery ].includes(view.type) && ([ I.RelationType.Url, I.RelationType.Email, I.RelationType.Phone ].indexOf(relation.format) >= 0)) {
			const scheme = Relation.getUrlScheme(relation.format, record[relationKey]);

			Renderer.send('urlOpen', scheme + record[relationKey]);
			return;
		};

		if ((relationKey == 'name') && (!ref.ref.state.isEditing)) {
			const ids = selection ? selection.get(I.SelectType.Record) : [];
			if (keyboard.withCommand(e)) {
				if (ids.length) {
					return;
				} else {
					DataUtil.objectOpenWindow(record);
				};
			} else {
				DataUtil.objectOpenPopup(record);
			};
		} else {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		const relation = dbStore.getRelationByKey(relationKey);

		if (!relation) {
			return;
		};

		value = Relation.formatValue(relation, value, true);

		let obj: any = { id: id };
		obj[relationKey] = value;

		detailStore.update(subId, id, obj);
		C.ObjectSetDetails(id, [ { key: relationKey, value: value } ], callBack);

		const key = Relation.checkRelationValue(relation, value) ? 'ChangeRelationValue' : 'DeleteRelationValue';		
		analytics.event(key, { type: 'dataview' });
	};

	onContext (e: any, id: string): void {
		e.preventDefault();
		e.stopPropagation();

		const { rootId, block, dataset } = this.props;
		const { selection } = dataset || {};
		const subId = dbStore.getSubId(rootId, block.id);
		
		let ids = selection.get(I.SelectType.Record);
		if (!ids.length) {
			ids = [ id ];
		};

		menuStore.open('dataviewContext', {
			recalcRect: () => { 
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			onClose: () => { selection.clear(); },
			data: {
				objectIds: ids,
				subId,
			}
		});
	};

	resize () {
		if (this.viewRef && this.viewRef.resize) {
			this.viewRef.resize();
		};
	};

});

export default BlockDataview;
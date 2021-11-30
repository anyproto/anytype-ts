import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I, C, Util, DataUtil, analytics, translate } from 'ts/lib';
import { observer } from 'mobx-react';
import { menuStore, dbStore, detailStore } from 'ts/store';
import arrayMove from 'array-move';

import Controls from './dataview/controls';

import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';
import ViewList from './dataview/view/list';

interface Props extends I.BlockComponent, RouteComponentProps<any> {};
interface State {
	viewId: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

const BlockDataview = observer(class BlockDataview extends React.Component<Props, State> {

	viewRef: any = null;
	cellRefs: Map<string, any> = new Map();
	viewId: string = '';
	state = {
		viewId: '',
	};

	constructor (props: any) {
		super(props);
		
		this.getData = this.getData.bind(this);
		this.getRecord = this.getRecord.bind(this);
		this.getView = this.getView.bind(this);
		this.onRowAdd = this.onRowAdd.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.optionCommand = this.optionCommand.bind(this);
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

		let ViewComponent: React.ReactType<I.ViewComponent>;
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
					onRowAdd={this.onRowAdd}
				/>
				<div className="content">
					<ViewComponent 
						ref={(ref: any) => { this.viewRef = ref; }} 
						onRef={(ref: any, id: string) => { this.cellRefs.set(id, ref); }} 
						{...this.props} 
						bodyContainer={Util.getBodyContainer(isPopup ? 'popup' : 'page')}
						pageContainer={Util.getPageContainer(isPopup ? 'popup' : 'page')}
						readonly={false} 
						getData={this.getData} 
						getRecord={this.getRecord}
						getView={this.getView} 
						onRowAdd={this.onRowAdd}
						onCellClick={this.onCellClick}
						onCellChange={this.onCellChange}
						optionCommand={this.optionCommand}
					/>
				</div>
			</div>
		);
	};

	componentDidMount () {
		const { rootId, block } = this.props;
		const view = this.getView();

		if (view) {
			dbStore.metaSet(rootId, block.id, { viewId: view.id, offset: 0, total: 0 });
			this.getData(view.id, 0);
		};

		this.resize();
		$(window).unbind('resize.dataview').on('resize.dataview', () => { this.resize(); });
	};

	componentDidUpdate () {
		const { rootId, block } = this.props;
		const { viewId } = dbStore.getMeta(dbStore.getSubId(rootId, block.id), '');

		if (viewId != this.state.viewId) {
			this.getData(viewId, 0);
		};

		this.resize();
		$(window).trigger('resize.editor');
	};

	componentWillUnmount () {
		const { rootId, block } = this.props;

		$(window).unbind('resize.dataview');
		C.ObjectSearchUnsubscribe([ dbStore.getSubId(rootId, block.id) ]);
	};

	getKeys (id: string) {
		const view = this.getView(id);
		const relationKeys = view.relations.map((it: any) => { return it.relationKey; });

		return Constant.defaultRelationKeys.concat(relationKeys).concat(Constant.coverRelationKeys);
	};

	getData (newViewId: string, offset: number, callBack?: (message: any) => void) {
		if (!newViewId) {
			return;
		};

		this.state.viewId = newViewId;
		this.setState({ viewId: newViewId });

		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		const { viewId } = dbStore.getMeta(subId, '');
		const viewChange = newViewId != viewId;
		const meta: any = { offset: offset };
		const cb = (message: any) => {
			if (callBack) {
				callBack(message);
			};
		};
		const view = this.getView(newViewId);
		const keys = this.getKeys(view.id);
		
		let limit = Constant.limit.dataview.records;
		if ([ I.ViewType.Grid, I.ViewType.Gallery, I.ViewType.List ].indexOf(view.type) >= 0) {
			limit = 0;
		};

		if (viewChange) {
			meta.viewId = newViewId;
			dbStore.recordsSet(subId, '', []);
		};

		dbStore.metaSet(subId, '', meta);
		DataUtil.getDataviewData(rootId, block.id, newViewId, keys, offset, limit, false, cb);
	};

	getRecord (index: number) {
		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		const records = dbStore.getRecords(subId, '');

		if (index > records.length - 1) {
			return {};
		};

		const record = records[index] || {};
		const item = detailStore.get(subId, record.id);

		let name = String(item.name || '');
		let isReadonly = Boolean(item.isReadonly);

		if (name == DataUtil.defaultName('page')) {
			name = '';
		};

		if (item.layout == I.ObjectLayout.Note) {
			name = String(item.snippet || '').replace(/\n/g, ' ');
		};
		if (item.isDeleted) {
			name = translate('commonDeleted');
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
		return views.find((it: I.View) => { return it.id == viewId; }) || views[0];
	};

	onRowAdd (e: any, dir: number) {
		e.persist();

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

		const newRecord: any = {};
		for (let filter of view.filters) {
			if (!conditions.includes(filter.condition) || !filter.value) {
				continue;
			};
			
			const relation = dbStore.getRelation(rootId, block.id, filter.relationKey);
			if (!relation || relation.isReadonlyValue) {
				continue;
			};

			newRecord[filter.relationKey] = DataUtil.formatRelationValue(relation, filter.value, true);
		};

		const create = (template: any) => {
			C.BlockDataviewRecordCreate(rootId, block.id, newRecord, template?.id, (message: any) => {
				if (message.error.code) {
					return;
				};

				const records = dbStore.getRecords(subId, '');
				const oldIndex = records.findIndex((it: any) => { return it.id == message.record.id; });
				const newIndex = dir > 0 ? records.length - 1 : 0;

				dbStore.recordsSet(subId, '', arrayMove(records, oldIndex, newIndex));

				const id = DataUtil.cellId('dataviewCell', 'name', newIndex);
				const ref = this.cellRefs.get(id);

				if (ref && (view.type == I.ViewType.Grid)) {
					window.setTimeout(() => { ref.onClick(e); }, 15);
				};

				if (template) {
					analytics.event('ObjectCreate', {
						objectType: template.targetObjectType,
						layout: template.layout,
						template: (template.templateIsBundled ? template.id : 'custom'),
					});
				};
			});
		};

		if (!setOf.length) {
			create('');
			return;
		};

		const showMenu = () => {
			menuStore.open('searchObject', {
				element: element,
				vertical: I.MenuDirection.Top,
				className: 'single',
				subIds: [ 'previewObject' ],
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
				showMenu();
			} else {
				create(message.records.length ? message.records[0] : '');
			};
		});
	};

	onCellClick (e: any, relationKey: string, index: number) {
		const { rootId, block } = this.props;
		const relation = dbStore.getRelation(rootId, block.id, relationKey);
		const id = DataUtil.cellId('dataviewCell', relationKey, index);
		const ref = this.cellRefs.get(id);
		const record = this.getRecord(index);
		const view = this.getView();

		if (!relation || !ref || !record) {
			return;
		};

		if ((view.type == I.ViewType.List) && ([ I.RelationType.Url, I.RelationType.Email, I.RelationType.Phone ].indexOf(relation.format) >= 0)) {
			const scheme = DataUtil.getRelationUrlScheme(relation.format, record[relationKey]);
			ipcRenderer.send('urlOpen', scheme + record[relationKey]);
			return;
		};

		if ((relationKey == 'name') && (!ref.ref.state.isEditing)) {
			DataUtil.objectOpenPopup(record);
		} else {
			ref.onClick(e);
		};
	};

	onCellChange (id: string, relationKey: string, value: any, callBack?: (message: any) => void) {
		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		const record = dbStore.getRecord(subId, '', id);
		const relation = dbStore.getRelation(rootId, block.id, relationKey);

		if (!record || !relation) {
			return;
		};

		value = DataUtil.formatRelationValue(relation, value, true);

		let obj: any = { id: record.id };
		obj[relationKey] = value;

		detailStore.update(subId, record.id, obj);
		C.BlockSetDetails(record.id, [ { key: relationKey, value: value } ], callBack);
	};

	optionCommand (code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: I.SelectOption, callBack?: (message: any) => void) {
		switch (code) {
			case 'add':
				C.BlockDataviewRecordRelationOptionAdd(rootId, blockId, relationKey, recordId, option, callBack);
				break;

			case 'update':
				C.BlockDataviewRecordRelationOptionUpdate(rootId, blockId, relationKey, recordId, option, callBack);
				break;

			case 'delete':
				C.BlockDataviewRecordRelationOptionDelete(rootId, blockId, relationKey, recordId, option.id, callBack);
				break;
		};
	};

	resize () {
		if (this.viewRef && this.viewRef.resize) {
			this.viewRef.resize();
		};
	};

});

export default BlockDataview;
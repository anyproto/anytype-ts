import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import arrayMove from 'array-move';
import { observer } from 'mobx-react';
import { throttle } from 'lodash';
import { Loader } from 'Component';
import { I, C, Util, DataUtil, ObjectUtil, analytics, Dataview, keyboard, Onboarding, Relation, Renderer } from 'Lib';
import { blockStore, menuStore, dbStore, detailStore, popupStore, commonStore } from 'Store';
import Constant from 'json/constant.json';

import Head from './dataview/head';
import Controls from './dataview/controls';

import ViewGrid from './dataview/view/grid';
import ViewBoard from './dataview/view/board';
import ViewGallery from './dataview/view/gallery';
import ViewList from './dataview/view/list';
import Empty from './dataview/empty';

interface Props extends I.BlockComponent {
	isInline?: boolean;
	isDragging?: boolean
};

interface State {
	loading: boolean;
};

const BlockDataview = observer(class BlockDataview extends React.Component<Props, State> {

	state = {
		loading: false,
	};
	node: any = null;
	refView: any = null;
	refHead: any = null;
	refControls: any = null;
	refCells: Map<string, any> = new Map();
	menuContext: any = null;
	viewId = '';
	creating = false;
	frame = 0;

	constructor (props: Props) {
		super(props);
		
		this.getData = this.getData.bind(this);
		this.getRecord = this.getRecord.bind(this);
		this.getView = this.getView.bind(this);
		this.getSources = this.getSources.bind(this);
		this.getKeys = this.getKeys.bind(this);
		this.getIdPrefix = this.getIdPrefix.bind(this);
		this.getVisibleRelations = this.getVisibleRelations.bind(this);
		this.onRecordAdd = this.onRecordAdd.bind(this);
		this.onCellClick = this.onCellClick.bind(this);
		this.onCellChange = this.onCellChange.bind(this);
		this.onContext = this.onContext.bind(this);
		this.onSourceSelect = this.onSourceSelect.bind(this);
		this.onSourceTypeSelect = this.onSourceTypeSelect.bind(this);
		this.onEmpty = this.onEmpty.bind(this);
		this.isAllowedObject = this.isAllowedObject.bind(this);
	};

	render () {
		const { rootId, block, isPopup, isInline, isDragging } = this.props;
		const { loading } = this.state;
		const views = dbStore.getViews(rootId, block.id);
		const sources = this.getSources();
		const targetId = this.getObjectId();
		const object = detailStore.get(rootId, targetId);

		if (!views.length) {
			return null;
		};

		const view = this.getView();

		if (!view) {
			return null;
		};

		const types = Relation.getSetOfObjects(rootId, targetId, Constant.typeId.type);
		const relations = Relation.getSetOfObjects(rootId, targetId, Constant.typeId.relation);

		let { groupRelationKey, pageLimit } = view;
		let ViewComponent: any = null;
		let className = [ Util.toCamelCase('view-' + I.ViewType[view.type]), (object.isDeleted ? 'isDeleted' : '') ].join(' ');
		let head = null;
		let controls = null;
		let body = null;
		let content = null;

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
		};

		if (isInline) {
			head = (
				<Head 
					ref={(ref: any) => { this.refHead = ref; }} 
					{...this.props} 
					readonly={false} 
					getData={this.getData} 
					getView={this.getView} 
					getSources={this.getSources}
					getRecord={this.getRecord}
					onRecordAdd={this.onRecordAdd}
					onSourceSelect={this.onSourceSelect}
					onSourceTypeSelect={this.onSourceTypeSelect}
					className={className}
					isInline={isInline}
					isAllowedObject={this.isAllowedObject}
				/>
			);
		};

		if (!isDragging) {
			controls = (
				<Controls 
					ref={(ref: any) => { this.refControls = ref; }} 
					{...this.props} 
					className={className}
					readonly={false} 
					getData={this.getData} 
					getView={this.getView} 
					getSources={this.getSources}
					getRecord={this.getRecord}
					onRecordAdd={this.onRecordAdd}
					isInline={isInline}
					isAllowedObject={this.isAllowedObject}
				/>
			);

			if (loading) {
				body = <Loader id="set-loader" />
			} else
			if (!types.length && !relations.length) {
				body = (
					<Empty
						{...this.props}
						title="Type or relation has been deleted"
						description="Visit the Marketplace to re-install these entities or select another source."
						button="Select source"
						className={isInline ? 'withHead' : ''}
						withButton={true}
						onClick={this.onEmpty}
					/>
				);
			} else {
				body = (
					<div className="content">
						<ViewComponent 
							key={'view' + view.id}
							ref={(ref: any) => { this.refView = ref; }} 
							onRef={(ref: any, id: string) => { this.refCells.set(id, ref); }} 
							{...this.props} 
							bodyContainer={Util.getBodyContainer(isPopup ? 'popup' : 'page')}
							pageContainer={Util.getCellContainer(isPopup ? 'popup' : 'page')}
							readonly={false} 
							getData={this.getData} 
							getRecord={this.getRecord}
							getView={this.getView} 
							getSources={this.getSources}
							getKeys={this.getKeys}
							getIdPrefix={this.getIdPrefix}
							getLimit={() => this.getLimit(view.type)}
							getVisibleRelations={this.getVisibleRelations}
							onRecordAdd={this.onRecordAdd}
							onCellClick={this.onCellClick}
							onCellChange={this.onCellChange}
							onContext={this.onContext}
							isInline={isInline}
							isAllowedObject={this.isAllowedObject}
						/>
					</div>
				);
			};
		};

		if (!sources.length) {
			content = (
				<React.Fragment>
					<div className="hoverArea">
						{head}
					</div>

					<Empty
						{...this.props}
						title="No query selected"
						description="All objects satisfying your query will be displayed in Set"
						button="Select query"
						className={isInline ? 'withHead' : ''}
						withButton={true}
						onClick={this.onEmpty}
					/>
				</React.Fragment>
			);
		} else {
			content = (
				<React.Fragment>
					<div className="hoverArea">
						{head}
						{controls}
					</div>
					{body}
				</React.Fragment>
			);
		};

		return (
			<div
				ref={node => this.node = node}
			>
				{content}
			</div>
		);
	};

	componentDidMount () {
		const { rootId, block, isPopup, isDragging } = this.props;

		if (isDragging) {
			return;
		};

		const view = this.getView();
		const root = blockStore.getLeaf(rootId, rootId);

		if (view) {
			dbStore.metaSet(rootId, block.id, { viewId: view.id, offset: 0, total: 0 });
			this.getData(view.id, 0, true);
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

		if (viewId && (viewId != this.viewId)) {
			this.getData(viewId, 0, true);
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
		$(window).off(`resize.${block.id} keydown.${block.id} updateDataviewData.${block.id} setDataviewSource.${block.id}`);
	};

	rebind () {
		const { block } = this.props;
		const win = $(window);

		this.unbind();
		win.on(`resize.${block.id}`, throttle(() => { this.resize(); }, 20));
		win.on(`keydown.${block.id}`, throttle((e: any) => { this.onKeyDown(e); }, 100));
		win.on(`updateDataviewData.${block.id}`, () => { this.getData(this.getView().id, 0, true);});
		win.on(`setDataviewSource.${block.id}`, () => { 
			this.onSourceSelect(`#block-${block.id} #head-title-wrapper #value`, {}); 
		});
	};

	onKeyDown (e: any) {
		const { rootId, block, dataset, isInline } = this.props;
		const { selection } = dataset || {};
		const root = blockStore.getLeaf(rootId, rootId);
		const cmd = keyboard.cmdKey();
		const ids = selection ? selection.get(I.SelectType.Record) : [];
		const length = ids.length;
		const subId = dbStore.getSubId(rootId, block.id);

		if (!root || (!root.isObjectSet() && !root.isObjectSpace())) {
			return;
		};

		if (!this.creating) {
			keyboard.shortcut(`${cmd}+n`, e, (pressed: string) => { this.onRecordAdd(e, -1, true); });
		};

		if (!isInline && !keyboard.isFocused) {
			keyboard.shortcut(`${cmd}+a`, e, (pressed: string) => {
				selection.set(I.SelectType.Record, dbStore.getRecords(subId, ''));
			});
		};

		if (length) {
			keyboard.shortcut('backspace, delete', e, (pressed: string) => {
				C.ObjectListSetIsArchived(ids, true);
				
				selection.clear();
				analytics.event('MoveToBin', { count: length });
			});
		};
	};

	getObjectId () {
		const { rootId, block, isInline } = this.props;
		return isInline ? block.content.targetObjectId : rootId;
	};

	getKeys (id: string): string[] {
		let view = this.getView(id);
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

	getData (viewId: string, offset: number, clear: boolean, callBack?: (message: any) => void) {
		if (!viewId) {
			console.log('[BlockDataview.getData] No view id');
			return;
		};

		const view = this.getView(viewId);
		if (!view) {
			console.log('[BlockDataview.getData] No view');
			return;
		};

		this.viewId = viewId;

		const { rootId, block } = this.props;
		const subId = dbStore.getSubId(rootId, block.id);
		const keys = this.getKeys(viewId);
		const sources = this.getSources();

		if (!sources.length) {
			console.log('[BlockDataview.getData] No sources');
			return;
		}

		if (clear) {
			dbStore.recordsSet(subId, '', []);
		};

		dbStore.metaSet(subId, '', { offset, viewId });

		if ([ I.ViewType.Board ].includes(view.type)) {
			if (this.refView && this.refView.loadGroupList) {
				this.refView.loadGroupList();
			} else {
				this.viewId = '';
			};
		} else {
			if (clear) {
				this.setState({ loading: true });
			};

			Dataview.getData({
				rootId, 
				blockId: block.id, 
				newViewId: viewId, 
				keys, 
				offset: 0, 
				limit: offset + this.getLimit(view.type), 
				clear,
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

	getView (viewId?: string): I.View {
		const { rootId, block } = this.props;
		return Dataview.getView(rootId, block.id, viewId);
	};

	getSources (): string[] {
		const { rootId, block, isInline } = this.props;
		const { targetObjectId } = block.content;

		if (isInline && !targetObjectId) {
			return [];
		};

		const object = detailStore.get(rootId, isInline ? targetObjectId : rootId, [ 'setOf' ]);
		return object.setOf || [];
	};

	onEmpty (e: any) {
		const { isInline } = this.props;

		if (isInline) {
			this.onSourceSelect(e.currentTarget, { horizontal: I.MenuDirection.Center });
		} else {
			this.onSourceTypeSelect(e.currentTarget);
		};
	};

	onRecordAdd (e: any, dir: number, withPopup?: boolean) {
		if (e.persist) {
			e.persist();
		};

		const { rootId, block } = this.props;
		const objectId = this.getObjectId();
		const object = detailStore.get(rootId, objectId, [ 'setOf' ], true);
		const setOf = object.setOf || [];
		const element = $(e.currentTarget);
		const view = this.getView();
		const subId = dbStore.getSubId(rootId, block.id);
		const conditions = [
			I.FilterCondition.Equal,
			I.FilterCondition.In,
			I.FilterCondition.AllIn,
		]; 

		const types = Relation.getSetOfObjects(rootId, objectId, Constant.typeId.type);
		const relations = Relation.getSetOfObjects(rootId, objectId, Constant.typeId.relation);
		const details: any = {
			type: types.length ? types[0].id : commonStore.type,
		};

		if (relations.length) {
			relations.forEach((it: any) => {
				details[it.relationKey] = Relation.formatValue(it, null, true);
			});
		};

		for (let filter of view.filters) {
			if (!conditions.includes(filter.condition) || !filter.value) {
				continue;
			};
			
			const relation = dbStore.getRelationByKey(filter.relationKey);
			if (relation && !relation.isReadonlyValue) {
				details[filter.relationKey] = Relation.formatValue(relation, filter.value, true);
			};
		};

		this.creating = true;

		const create = (template: any) => {
			C.ObjectCreate(details, [], template?.id, (message: any) => {
				this.creating = false;

				if (message.error.code) {
					return;
				};

				const object = message.details;
				const records = dbStore.getRecords(subId, '');
				const oldIndex = records.indexOf(message.objectId);
				const newIndex = dir > 0 ? records.length - 1 : 0;

				if (oldIndex < 0) {
					dbStore.recordAdd(subId, '', object.id, newIndex);
				} else {
					dbStore.recordsSet(subId, '', arrayMove(records, oldIndex, newIndex));
				};

				const id = Relation.cellId(this.getIdPrefix(), 'name', newIndex);
				const ref = this.refCells.get(id);

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

		if (details.type == Constant.typeId.bookmark) {
			menuStore.open('dataviewCreateBookmark', {
				type: I.MenuType.Horizontal,
				element,
				vertical: dir > 0 ? I.MenuDirection.Top : I.MenuDirection.Bottom,
				horizontal: dir > 0 ? I.MenuDirection.Left : I.MenuDirection.Right,
			});
			return;
		};

		const showPopup = () => {
			popupStore.open('template', { data: { typeId: details.type, onSelect: create } });
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
		const id = Relation.cellId(this.getIdPrefix(), relationKey, index);
		const ref = this.refCells.get(id);
		const record = this.getRecord(index);
		const view = this.getView();

		if (!relation || !ref || !record) {
			return;
		};

		if ([ I.ViewType.List, I.ViewType.Gallery, I.ViewType.Board ].includes(view.type) && Relation.isUrl(relation.format)) {
			Renderer.send('urlOpen', Relation.getUrlScheme(relation.format, record[relationKey]) + record[relationKey]);
			return;
		};

		if ((relationKey == 'name') && (!ref.ref.state.isEditing)) {
			const ids = selection ? selection.get(I.SelectType.Record) : [];
			if (keyboard.withCommand(e)) {
				if (ids.length) {
					return;
				} else {
					ObjectUtil.openWindow(record);
				};
			} else {
				ObjectUtil.openPopup(record);
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

		let obj: any = { id };
		obj[relationKey] = value;

		detailStore.update(subId, obj, false);
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

	onSourceSelect (element: any, param: Partial<I.MenuParam>) {
		const { rootId, block, isPopup, isInline } = this.props;
		const { targetObjectId } = block.content;

		const onSelect = (item: any, isNew: boolean) => {
			C.BlockDataviewCreateFromExistingObject(rootId, block.id, item.id, (message: any) => {
				const button = $(this.node).find('#head-source-select');

				if (isNew && button.length) {
					button.trigger('click');
				};

				if (message.views && message.views.length) {
					window.setTimeout(() => { this.getData(message.views[0].id, 0, true); }, 50);
				};

				if (isInline) {
					Onboarding.start('inlineSet', isPopup, false, {
						parseParam: (param: any) => {
							param.element = [ `#block-${block.id}`, param.element ].join(' ');
							return param;
						},
					});
				};
			});

			analytics.event('InlineSetSetSource', { type: isNew ? 'newObject': 'externalObject' });
		};

		const menuParam = Object.assign({
			element: $(element),
			className: 'single',
			data: {
				rootId,
				blockId: block.id,
				blockIds: [ block.id ],
				value: [ targetObjectId ],
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.typeId.set },
					{ operator: I.FilterOperator.And, relationKey: 'setOf', condition: I.FilterCondition.NotEmpty, value: null },
				],
				canAdd: true,
				addParam: { 
					name: 'Create new set',
					onClick: () => {
						C.ObjectCreateSet([], {}, '', (message: any) => { onSelect(message.details, true); });
					},
				},
				onSelect,
			}
		}, param || {});

		menuStore.open('searchObject', menuParam);
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

	getIdPrefix () {
		return [ 'dataviewCell', this.props.block.id ].join('-');
	};

	getVisibleRelations () {
		const { rootId, block } = this.props;
		const view = this.getView();
		const relations = dbStore.getObjectRelations(rootId, block.id).map(it => it.relationKey);

		return view.getVisibleRelations().filter(it => relations.includes(it.relationKey));
	};

	isAllowedObject () {
		const { rootId, block, readonly } = this.props;
		const targetId = this.getObjectId();
		const types = Relation.getSetOfObjects(rootId, targetId, Constant.typeId.type).map(it => it.id);
		const skipTypes = DataUtil.getFileTypes().concat(DataUtil.getSystemTypes());

		let allowed = !readonly && blockStore.checkFlags(rootId, block.id, [ I.RestrictionDataview.Object ]);
		for (const type of types) {
			if (skipTypes.includes(type)) {
				allowed = false;
				break;
			};
		};
		return allowed;
	};

	resize () {
		if (this.frame) {
			raf.cancel(this.frame);
		};

		this.frame = raf(() => {
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
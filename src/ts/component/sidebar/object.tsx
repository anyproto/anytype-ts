import * as React from 'react';
import raf from 'raf';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Title, Filter, Select, Icon, IconObject, Button, ObjectName, ObjectDescription, ObjectType } from 'Component';
import { I, U, J, S, translate, Storage, sidebar, keyboard, analytics } from 'Lib';

interface State {
	isLoading: boolean;
};

const LIMIT = 20;
const HEIGHT = 64;
const KEY_TYPE = 'objectContainerType';
const KEY_SORT = 'objectContainerSort';

const SidebarObject = observer(class SidebarObject extends React.Component<{}, State> {
	
	state = {
		isLoading: false,
	};
	node = null;
	refFilter = null;
	refSelect = null;
	refList = null;
	cache: any = {};
	offset = 0;
	sortId = '';
	sortType: I.SortType = I.SortType.Asc;
	orphan = false;
	type: I.ObjectContainerType = I.ObjectContainerType.Object;
	searchIds: string[] = null;
	filter = '';
	timeoutFilter = 0;
	preventClose = false;

	constructor (props: any) {
		super(props);

		this.onSort = this.onSort.bind(this);
		this.onSwitchType = this.onSwitchType.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onAdd = this.onAdd.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};

    render() {
		const { isLoading } = this.state;
		const items = this.getItems();
		const isAllowedObject = this.isAllowedObject();
		const typeOptions = this.getTypeOptions();
		const rootId = keyboard.getRootId();

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			if (!item) {
				return null;
			};

			const cn = [ 'item', U.Data.layoutClass(item.id, item.layout) ];
			const type = S.Record.getTypeById(item.type);

			let iconSmall = null;
			let iconLarge = null;

			if (U.Object.isTypeOrRelationLayout(item.layout)) {
				const size = U.Object.isTypeLayout(item.layout) ? 18 : 20;

				iconSmall = <IconObject object={item} size={size} iconSize={18} />;
			} else {
				iconLarge = <IconObject object={item} size={48} />;
			};

			if (item.id == rootId) {
				cn.push('active');
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					<div 
						className={cn.join(' ')} 
						style={param.style}
						onClick={() => this.onClick(item)}
					>
						{iconLarge}
						<div className="info">
							<div className="nameWrap">
								{iconSmall}
								<ObjectName object={item} />
							</div>
							<div className="descrWrap">
								<div className="type">
									<ObjectType object={type} />
								</div>
								<ObjectDescription object={item} />
							</div>
						</div>
					</div>
				</CellMeasurer>
			);
		};

        return (
			<div 
				id="containerObject"
				ref={ref => this.node = ref}
			>
				<div className="head">
					<Title text="Library" />

					<div className="sides sidesSort">
						<div className="side left">
							<Select 
								id="object-select-type" 
								ref={ref => this.refSelect = ref}
								value=""
								options={typeOptions} 
								onChange={this.onSwitchType}
								menuParam={{
									className: 'fixed',
									classNameWrap: 'fromSidebar',
								}}
							/>
						</div>
						<div className="side right">
							<Icon id="button-object-sort" className="sort" onClick={this.onSort} />
						</div>
					</div>

					<div className="sides sidesFilter">
						<div className="side left">
							<Filter 
								ref={ref => this.refFilter = ref}
								icon="search"
								placeholder={translate('commonSearch')}
								onChange={this.onFilterChange}
								onClear={this.onFilterClear}
							/>
						</div>
						<div className="side right">
							{isAllowedObject ? <Button color="blank" className="c28" text={translate('commonNew')} onClick={this.onAdd} /> : ''}
						</div>
					</div>
				</div>

				<div className="body">
					{this.cache && items.length && !isLoading ? (
						<div className="items">
							<InfiniteLoader
								rowCount={items.length + 1}
								loadMoreRows={this.loadMoreRows}
								isRowLoaded={({ index }) => !!items[index]}
								threshold={LIMIT}
							>
								{({ onRowsRendered }) => (
									<AutoSizer className="scrollArea">
										{({ width, height }) => (
											<List
												ref={ref => this.refList = ref}
												width={width}
												height={height}
												deferredMeasurmentCache={this.cache}
												rowCount={items.length}
												rowHeight={HEIGHT}
												rowRenderer={rowRenderer}
												onRowsRendered={({ startIndex, stopIndex }) => { 
													onRowsRendered({ startIndex, stopIndex });

													this.resize();
												}}
												overscanRowCount={10}
												scrollToAlignment="center"
											/>
										)}
									</AutoSizer>
								)}
							</InfiniteLoader>
						</div>
					) : ''}
				</div>
			</div>
		);
    };

	componentDidMount () {
		this.type = Storage.get(KEY_TYPE) || I.ObjectContainerType.Object;

		const sort = Storage.get(this.getSortKey(this.type));
		if (sort) {
			this.sortId = sort.id;
			this.sortType = sort.type;
		};

		this.rebind();
		this.load(true);
		this.refSelect.setValue(this.type);
	};

	componentDidUpdate () {
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: i => (items[i] || {}).id,
		});

		this.resize();
	};

	componentWillUnmount(): void {
		window.clearTimeout(this.timeoutFilter);
		this.unbind();
	};

	unbind () {
		$(window).off('mousedown.sidebarContainerObject');
	};

	rebind () {
		this.unbind();

		$(window).on('mousedown.sidebarContainerObject', (e: any) => {
			const target = $(e.target);

			if (
				!target.parents(`#containerObject`).length && 
				!target.parents(`.menus`).length &&
				!target.parents(`#widget-buttons`).length &&
				!this.preventClose
			) {
				sidebar.objectContainerToggle();
			};
		});
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const option = U.Menu.getObjectContainerSortOptions(this.sortId, this.sortType).find(it => it.id == this.sortId);

		let sorts: I.Sort[] = [];
		let filters: I.Filter[] = [
			{ relationKey: 'layout', condition: I.FilterCondition.NotEqual, value: I.ObjectLayout.Participant },
		];

		if (option) {
			sorts.push({ relationKey: option.relationKey, type: this.sortType });
		} else {
			sorts = sorts.concat([
				{ type: I.SortType.Desc, relationKey: 'createdDate' },
				{ type: I.SortType.Asc, relationKey: 'name' },
			]);
		};

		if (this.searchIds) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.In, value: this.searchIds || [] });
		};

		switch (this.type) {
			case I.ObjectContainerType.Object: {
				filters.push({ relationKey: 'layout', condition: I.FilterCondition.NotIn, value: U.Object.getFileAndSystemLayouts() });
				break;
			};

			case I.ObjectContainerType.Type: {
				filters.push({ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Type });
				break;
			};

			case I.ObjectContainerType.File: {
				filters.push({ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.File });
				break;
			};

			case I.ObjectContainerType.Media: {
				filters = filters.concat([
					{ relationKey: 'layout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() },
					{ relationKey: 'layout', condition: I.FilterCondition.NotEqual, value: I.ObjectLayout.File },
				]);
				break;
			};

			case I.ObjectContainerType.Bookmark: {
				filters.push({ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Bookmark });
				break;
			};

			case I.ObjectContainerType.Relation: {
				filters.push({ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Relation });
				break;
			};
		};

		if (this.orphan) {
			filters = filters.concat([
				{ relationKey: 'links', condition: I.FilterCondition.Empty, value: null },
				{ relationKey: 'backlinks', condition: I.FilterCondition.Empty, value: null },
			]);
		};

		if (clear) {
			this.setState({ isLoading: true });
			S.Record.recordsSet(J.Constant.subId.allObject, '', []);
		};

		U.Data.searchSubscribe({
			subId: J.Constant.subId.allObject,
			filters,
			sorts,
			offset: 0,
			limit: this.offset + J.Constant.limit.menuRecords,
			ignoreHidden: true,
			ignoreDeleted: true,
		}, (message: any) => {
			this.setState({ isLoading: false });

			if (callBack) {
				callBack(message);
			};
		});
	};

	loadMoreRows ({ startIndex, stopIndex }) {
		return new Promise((resolve, reject) => {
			this.offset += J.Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	getItems () {
		return S.Record.getRecords(J.Constant.subId.allObject);
	};

	onClick (item: any) {
		U.Object.openConfig(item);
		this.preventClose = true;
	};

	onSort (e: any) {
		const options = U.Menu.getObjectContainerSortOptions(this.sortId, this.sortType);

		S.Menu.open('select', {
			element: '#sidebar #containerObject #button-object-sort',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			className: 'fixed',
			classNameWrap: 'fromSidebar',
			data: {
				options,
				value: this.sortId,
				onSelect: (e: any, item: any) => {
					this.sortId = item.id;
					this.sortType = item.type;
					this.load(true);

					Storage.set(this.getSortKey(this.type), { id: item.id, type: item.type });
				},
			}
		});
	};

	onAdd () {
		const details = {
			...this.getDetailsByType(this.type),
			name: this.refFilter.getValue(),
		};

		keyboard.pageCreate(details, analytics.route.allObjects);
	};

	isAllowedObject (): boolean {
		const canWrite = U.Space.canMyParticipantWrite();

		return canWrite && ![ 
			I.ObjectContainerType.File, 
			I.ObjectContainerType.Media, 
		].includes(this.type);
	};

	onSwitchType (id: string) {
		if (id == I.ObjectContainerType.Orphan) {
			this.orphan = !this.orphan;
		} else {
			this.type = id as I.ObjectContainerType;
			Storage.set(KEY_TYPE, this.type);
		};

		this.refSelect.setOptions(this.getTypeOptions());
		this.refSelect.setValue(this.type);
		this.load(true);
	};

	getTypeOptions () {
		return ([
			{ id: I.ObjectContainerType.Object, name: translate('sidebarObjectTypeObject') },
			{ id: I.ObjectContainerType.File, name: translate('sidebarObjectTypeFile') },
			{ id: I.ObjectContainerType.Media, name: translate('sidebarObjectTypeMedia') },
			{ id: I.ObjectContainerType.Bookmark, name: translate('sidebarObjectTypeBookmark') },
			{ id: I.ObjectContainerType.Type, name: translate('sidebarObjectTypeType') },
			//{ id: I.ObjectContainerType.Relation, name: translate('sidebarObjectTypeRelation') },
			{ id: I.ObjectContainerType.Orphan, icon: `checkbox c${Number(this.orphan)}`, name: translate('sidebarObjectTypeOrphan') },
		] as any[]).map(it => {
			if (it.id != I.ObjectContainerType.Orphan) {
				it.className = 'weightMedium';
			};
			return it;
		});
	};

	getDetailsByType (t: I.ObjectContainerType) {
		const details: any = {};

		let type = null;

		switch (t) {
			case I.ObjectContainerType.Bookmark: {
				type = S.Record.getBookmarkType();
				break;
			};

			case I.ObjectContainerType.Type: {
				type = S.Record.getTypeType();
				break;
			};
		};

		if (type) {
			details.type = type.id;
		};

		return details;
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
					this.load(true);
				});
			} else {
				this.searchIds = null;
				this.load(true);
			};
		}, J.Constant.delay.keyboard);
	};

	onFilterClear () {
		this.searchIds = null;
		this.load(true);
	};

	getSortKey (tab: I.ObjectContainerType) {
		return U.Common.toCamelCase(`${KEY_SORT}-${tab}`);
	};

	resize () {
		const node = $(this.node);
		const list = node.find('> .body');

		raf(() => {
			list.find('.item').each((i: number, item: any) => {
				item = $(item);
				item.find('.iconObject').length ? item.addClass('withIcon') : item.removeClass('withIcon');
			});
		});
	};

});

export default SidebarObject;
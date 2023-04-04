import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Icon, MenuItemVertical, Loader } from 'Component';
import { I, C, analytics, keyboard, DataUtil, Action, Util } from 'Lib';
import { commonStore, detailStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT = 20;

const MenuTypeSuggest = observer(class MenuTypeSuggest extends React.Component<I.Menu, State> {

	state = {
		loading: false,
	};

	_isMounted = false;
	filter = '';
	cache: any = null;
	items: any[] = [];
	refFilter: any = null;
	refList: any = null;
	n = -1;
	offset = 0;
	timeoutFilter = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { filter, noFilter } = data;
		const items = this.getItems();

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			let content = null;
			if (item.id == 'add') {
				content =  (
					<div 
						id="item-add" 
						className="item add" 
						onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }} 
						style={param.style}
					>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else
			if (item.isDiv) {
				content = (
					<div className="separator" style={param.style}>
						<div className="inner" />
					</div>
				);
			} else
			if (item.isSection) {
				content = <div className={[ 'sectionName', (param.index == 0 ? 'first' : '') ].join(' ')} style={param.style}>{item.name}</div>;
			} else {
				content = (
					<MenuItemVertical 
						{...item}
						className={item.isHidden ? 'isHidden' : ''}
						style={param.style}
						onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }}
					/>
				);
			};

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				{!noFilter ? (
					<Filter 
						ref={ref => { this.refFilter = ref; }} 
						placeholderFocus="Filter types..." 
						value={filter}
						onChange={this.onFilterChange} 
					/>
				) : ''}

				{loading ? <Loader /> : ''}

				<div className="items">
					<InfiniteLoader
						rowCount={items.length + 1}
						loadMoreRows={this.loadMoreRows}
						isRowLoaded={({ index }) => !!items[index]}
						threshold={LIMIT}
					>
						{({ onRowsRendered, registerChild }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={ref => { this.refList = ref; }}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={({ index }) => this.getRowHeight(items[index])}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={LIMIT}
										scrollToAlignment="center"
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;

		this.rebind();
		this.resize();
		this.focus();
		this.load(true);

		this.forceUpdate();
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems();

		if (filter != this.filter) {
			this.filter = filter;
			this.n = -1;
			this.offset = 0;
			this.load(true);
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});

		this.resize();
		this.focus();
		this.props.setActive();
	};
	
	componentWillUnmount () {
		this._isMounted = false;

		menuStore.closeAll([ 'searchObject' ]);
		menuStore.clearTimeout();

		window.clearTimeout(this.timeoutFilter);
	};

	focus () {
		window.setTimeout(() => { 
			if (this.refFilter) {
				this.refFilter.focus(); 
			};
		}, 15);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		if (!this._isMounted) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { skipIds, smartblockTypes } = data;
		const filter = String(data.filter || '');
		
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: [ Constant.typeId.type, Constant.storeTypeId.type ] },
		];
		const sorts = [
			{ relationKey: 'workspaceId', type: I.SortType.Desc },
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		if (smartblockTypes && smartblockTypes.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'smartblockTypes', condition: I.FilterCondition.In, value: smartblockTypes });
		};

		if (skipIds && skipIds.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			this.setState({ loading: true });
		};

		DataUtil.search({
			filters,
			sorts,
			keys: Constant.defaultRelationKeys.concat(Constant.typeRelationKeys),
			fullText: filter,
			offset: this.offset,
			limit: Constant.limit.menuRecords,
			ignoreWorkspace: true,
		}, (message: any) => {
			if (!this._isMounted) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records.map(it => detailStore.mapper(it)));

			if (clear) {
				this.setState({ loading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	getSections () {
		const { workspace } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const items = Util.objectCopy(this.items || []).map(it => ({ ...it, object: it }));
		const library = items.filter(it => (it.workspaceId == workspace));
		const librarySources = library.map(it => it.sourceObject);

		let sections: any[] = [
			{ id: 'library', name: 'My types', children: library },
		];
		let name = 'Create new type';

		if (filter) {
			const store = items.filter(it => (it.workspaceId == Constant.storeSpaceId) && !librarySources.includes(it.id));

			sections = sections.concat([
				{ id: 'store', name: 'Anytype library', children: store },
			]);

			name = `Create type "${filter}"`;
		} else {
			sections = sections.concat([
				{ 
					children: [
						{ id: 'store', icon: 'store', name: 'Anytype library', arrow: true }
					] 
				},
			])
		};

		sections.unshift({ children: [ { id: 'add', name } ] });

		sections = sections.filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});

		return sections;
	};
	
	getItems () {
		let sections = this.getSections();
		let items: any[] = [];

		sections.forEach((section: any, i: number) => {
			if (section.name && section) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};

			items = items.concat(section.children);

			if (i < sections.length - 1) {
				items.push({ isDiv: true });
			};
		});

		return items;
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.props.param.data.filter = this.refFilter.getValue();
		}, 500);
	};

	onMouseEnter (e: any, item: any) {
		e.persist();

		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};

	onOver (e: any, item: any) {
		if (!this._isMounted) {
			return;
		};

		if (!item.arrow) {
			menuStore.closeAll([ 'searchObject' ]);
			return;
		};

		const { getId, getSize, param } = this.props;
		const { data } = param;
		const { smartblockTypes } = data;
		const sources = this.getLibrarySources();

		let menuId = '';
		let menuParam: I.MenuParam = {
			menuKey: item.id,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			offsetY: 36,
			vertical: I.MenuDirection.Top,
			isSub: true,
			noFlipY: true,
			data: {
				rebind: this.rebind,
				ignoreWorkspace: true,
			},
		};

		switch (item.id) {
			case 'store': {
				menuId = 'searchObject';
				menuParam.className = 'single';

				const filters: I.Filter[] = [
					{ operator: I.FilterOperator.And, relationKey: 'workspaceId', condition: I.FilterCondition.Equal, value: Constant.storeSpaceId },
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.Equal, value: Constant.storeTypeId.type },
					{ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: sources },
				];
				if (smartblockTypes && smartblockTypes.length) {
					filters.push({ operator: I.FilterOperator.And, relationKey: 'smartblockTypes', condition: I.FilterCondition.In, value: smartblockTypes });
				};

				menuParam.data = Object.assign(menuParam.data, {
					ignoreWorkspace: true,
					keys: Constant.defaultRelationKeys.concat(Constant.typeRelationKeys),
					filters,
					sorts: [
						{ relationKey: 'name', type: I.SortType.Asc },
					],
					onSelect: (item: any) => {
						this.onClick(e, detailStore.mapper(item));
					},
				});
				break;
			};
		};

		if (menuId && !menuStore.isOpen(menuId, item.id)) {
			menuStore.closeAll([ 'searchObject' ], () => {
				menuStore.open(menuId, menuParam);
			});
		};
	};
	
	onClick (e: any, item: any) {
		const { close, param } = this.props;
		const { data } = param;
		const { filter, onClick, noInstall } = data;

		if (item.arrow) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		const cb  = (item: any) => {
			close(); 

			if (onClick) {
				onClick(item);
			};
		};

		if (item.id == 'add') {
			C.ObjectCreateObjectType({ name: filter }, [], (message: any) => {
				if (!message.error.code) {
					cb(message.details);
					analytics.event('CreateType');
				};
			});
		} else {
			if (item.isInstalled || noInstall) {
				cb(item);
			} else {
				Action.install(item, (message: any) => { cb(message.details); });
			};
		};
	};

	getRowHeight (item: any) {
		return item.isDiv ? HEIGHT_DIV : HEIGHT_ITEM;
	};

	getLibrarySources () {
		return this.items.filter(it => (it.workspaceId == commonStore.workspace)).map(it => it.sourceObject).filter(it => it);
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const height = Math.min(376, items.reduce((res: number, current: any) => { return res + this.getRowHeight(current); }, 16 + (!noFilter ? 44 : 0)));

		obj.css({ height });
		position();
	};

});

export default MenuTypeSuggest;
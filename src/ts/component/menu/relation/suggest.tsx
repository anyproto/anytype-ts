import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Filter, Icon, MenuItemVertical, Loader } from 'Component';
import { I, analytics, keyboard, DataUtil, Action } from 'Lib';
import { commonStore, menuStore, detailStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
};

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT = 20;

const MenuRelationSuggest = observer(class MenuRelationSuggest extends React.Component<Props, State> {

	state = {
		loading: false,
	};

	_isMounted: boolean = false;
	filter: string = '';
	cache: any = null;
	items: any[] = [];
	refFilter: any = null;
	refList: any = null;
	n: number = -1;
	offset: number = 0;
	timeoutFilter: number = 0;

	constructor (props: any) {
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
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
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
						object={item}
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
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
					hasFixedWidth={() => {}}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				{!noFilter ? (
					<Filter 
						ref={(ref: any) => { this.refFilter = ref; }} 
						placeholderFocus="Filter objects..." 
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
										ref={(ref: any) => { this.refList = ref; }}
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
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
		this.focus();
		this.props.setActive();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
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
			this.offset += Constant.limitMenuRecords;
			this.load(false, resolve);
		});
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		if (!this._isMounted) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { skipIds } = data;
		const filter = String(data.filter || '');
		
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.In, value: [ Constant.typeId.relation, Constant.storeTypeId.relation ] },
			{ operator: I.FilterOperator.And, relationKey: 'relationKey', condition: I.FilterCondition.NotIn, value: Constant.systemRelationKeys },
		];

		const sorts = [
			{ relationKey: 'workspaceId', type: I.SortType.Desc },
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		if (skipIds && skipIds.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'relationKey', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			this.setState({ loading: true });
		};

		DataUtil.search({
			filters,
			sorts,
			keys: Constant.relationRelationKeys,
			fullText: filter,
			offset: this.offset,
			limit: Constant.limitMenuRecords,
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

			this.items = this.items.concat(message.records.map(it => detailStore.check(it)));

			if (clear) {
				this.setState({ loading: false });
				analytics.event('SearchQuery', { route: 'MenuRelation', length: filter.length });
			} else {
				this.forceUpdate();
			};
		});
	};

	getSections () {
		const { workspace } = commonStore;
		const library = this.items.filter(it => it.workspaceId == workspace);
		const librarySources = library.map(it => it.sourceObject);
		const marketplace = this.items.filter(it => (it.workspaceId == Constant.storeSpaceId) && !librarySources.includes(it.id));

		return [
			{ id: 'library', name: 'My relations', children: library },
			{ id: 'marketplace', name: 'Marketplace', children: marketplace },
		].filter((section: any) => {
			section.children = section.children.filter(it => it);
			return section.children.length > 0;
		});
	};
	
	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const name = filter ? `Create relation "${filter}"` : 'Create from scratch';
		const sections = this.getSections();

		let items: any[] = [];
		for (let section of sections) {
			if (section.name && section) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
			items.push({ isDiv: true });
		};

		items.push({ id: 'add', name: name });
		return items;
	};

	onFilterChange (v: string) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.props.param.data.filter = this.refFilter.getValue();
		}, 500);
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { close, param, getId, getSize } = this.props;
		const { data, classNameWrap } = param;
		const { rootId, blockId, menuIdEdit, addCommand, ref } = data;

		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			close();
			return;
		};

		if (item.id == 'add') {
			menuStore.open(menuIdEdit, { 
				element: `#${getId()} #item-${item.id}`,
				offsetX: getSize().width,
				offsetY: -80,
				noAnimation: true,
				classNameWrap: classNameWrap,
				data: {
					...data,
					rebind: this.rebind,
					onChange: () => { 
						close(); 
					},
				}
			});
		} else 
		if (addCommand) {
			const cb  = (item: any) => {
				close(); 
				addCommand(rootId, blockId, item);
			};

			if (item.isInstalled) {
				cb(item);
				analytics.event('AddExistingRelation', { format: item.format, type: ref });
			} else {
				Action.install(item, (message: any) => { cb(message.details); });
			};
		};
	};

	getRowHeight (item: any) {
		let h = HEIGHT_ITEM;
		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const height = items.reduce((res: number, current: any) => { return res + this.getRowHeight(current); }, noFilter ? 16 : 60);

		obj.css({ height });
		position();
	};

});

export default MenuRelationSuggest;
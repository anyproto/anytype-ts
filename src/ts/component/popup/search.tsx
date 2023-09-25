import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { Icon, Loader, IconObject, ObjectName, EmptySearch, Label, Filter } from 'Component';
import { I, UtilCommon, UtilData, UtilObject, Relation, keyboard, Key, focus, translate, analytics } from 'Lib';
import { commonStore, dbStore, menuStore } from 'Store';
import Constant from 'json/constant.json';

interface FilterItem {
	relation: any;
	condition: I.FilterCondition;
	value: any;
};

interface State {
	loading: boolean;
};

const HEIGHT_SECTION = 26;
const HEIGHT_ITEM = 48;
const LIMIT_HEIGHT = 12;
const SYMBOLS = [ ':', '<=', '>=', '=', '<', '>' ];

const PopupSearch = observer(class PopupSearch extends React.Component<I.Popup, State> {
	
	_isMounted = false;
	node: any = null;
	state = {
		loading: false,
	};
	refFilter: any = null;
	refList: any = null;
	timeout = 0;
	cache: any = {};
	items: any[] = [];
	parsedFilters: FilterItem[] = [];
	newFilter: FilterItem = null;
	n = -1;
	top = 0;
	offset = 0;
	filter = '';
	
	constructor (props: I.Popup) {
		super (props);

		this.onClick = this.onClick.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.onFilterKeyUp = this.onFilterKeyUp.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.filterMapper = this.filterMapper.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const filter = this.getFilter();
		const items = this.getItems();
		const parsedFilter = this.getParsedFilters();

		const Item = (item: any) => {
			let content = null;
			if (item.isObject) {
				content = (
					<React.Fragment>
						<IconObject object={item} size={18} />
						<ObjectName object={item} />
						<div className="caption">{item.caption}</div>
					</React.Fragment>
				);
			} else {
				let caption = '';
				if (item.shortcut) {
					caption = item.shortcut.map(it => <div className="key">{it}</div>).join('');
				};

				content = (
					<React.Fragment>
						<Icon className={item.icon} />
						<div className="name">{item.name}</div>
						<div className="caption">
							{item.shortcut.map((item, i) => (
								<Label key={i} text={item} />
							))}
						</div>
					</React.Fragment>
				);
			};

			return (
				<div 
					id={'item-' + item.id} 
					className={[ 'item', (item.isHidden ? 'isHidden' : '') ].join(' ')} 
					onMouseOver={(e: any) => { this.onOver(e, item); }} 
					onClick={(e: any) => { this.onClick(e, item); }}
				>
					{content}
				</div>
			);
		};

		const rowRenderer = ({ index, key, style, parent }) => {
			const item = items[index];

			let content = null;
			if (item.isSection) {
				content = <div className={[ 'sectionName', (index == 0 ? 'first' : '') ].join(' ')} style={style}>{item.name}</div>;
			} else {
				content = (
					<div className="row" style={style}>
						<Item {...item} index={index} />
					</div>
				);
			};

			return (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={index}
				>
					{content}
				</CellMeasurer>
			);
		};

		console.log(JSON.stringify(this.parsedFilters, null, 3));

		return (
			<div 
				ref={node => this.node = node}
				className="wrap"
			>
				{loading ? <Loader id="loader" /> : ''}
				
				<div className="head">
					<Icon className="search" />

					<div className="parsedFilters">
						{this.parsedFilters.map((item: any, i: number) => {
							const condition = this.getCondition(item.relation.format, item.condition);

							return (
								<div key={i} className="element">
									<ObjectName object={item.relation} />
									{condition ? (
										<div className="condition">
											{condition.name}
										</div>
									) : ''}
								</div>
							);
						})}
					</div>

					<Filter 
						value={filter}
						ref={ref => this.refFilter = ref} 
						placeholder={translate('popupSearchPlaceholder')} 
						onKeyUp={this.onFilterKeyUp}
						onClear={this.onFilterClear}
					/>
				</div>

				{!items.length && !loading ? (
					<EmptySearch text={filter ? UtilCommon.sprintf(translate('popupSearchEmptyFilter'), filter) : translate('popupSearchEmpty')} />
				) : ''}
				
				{this.cache && items.length && !loading ? (
					<div key="items" className="items left">
						<InfiniteLoader
							rowCount={items.length + 1}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!items[index]}
							threshold={LIMIT_HEIGHT}
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
											rowHeight={({ index }) => this.getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											onScroll={this.onScroll}
											scrollToAlignment="center"
											overscanRowCount={10}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.n = -1;

		this.load(true);
		this.rebind();
		this.resize();

		focus.clear(true);
	};
	
	componentDidUpdate () {
		const items = this.getItems();
		const filter = this.getFilter();

		if (filter != this.filter) {
			this.n = -1;
			this.offset = 0;
			this.top = 0;
			this.filter = filter;
			this.load(true);
			return;
		};

		this.resize();
		this.setActive(items[this.n]);
		this.refFilter.setValue(this.filter);

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: i => (items[i] || {}).id,
		});

		if (this.refFilter && (this.n == -1)) {
			this.refFilter.focus();
		};
		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();

		window.clearTimeout(this.timeout);
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.search', e => this.onKeyDown(e));
		win.on('resize.search', (e: any) => { this.resize(); });
	};

	unbind () {
		$(window).off('keydown.search resize.search');
	};
	
	onScroll ({ scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	onKeyDown (e: any) {
		const items = this.getItems();
		const cmd = keyboard.cmdKey();
		const k = keyboard.eventKey(e);

		if (menuStore.isOpen()) {
			return;
		};

		if ((k != Key.down) && (this.n == -1)) {
			return;
		};

		keyboard.disableMouse(true);

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			this.onArrow(pressed == 'arrowup' ? -1 : 1);
		});

		keyboard.shortcut(`enter, shift+enter, ${cmd}+enter`, e, (pressed: string) => {
			const item = items[this.n];
			if (item) {
				this.onClick(e, item);
			};
		});
	};

	onArrow (dir: number) {
		if (!this.refList) {
			return;
		};

		const items = this.getItems();
		const l = items.length;

		if ((dir > 0) && (this.n == -1)) {
			this.refFilter.blur();
		};

		this.n += dir;

		if (((dir < 0) && (this.n == -1)) || ((dir > 0) && (this.n > l - 1))) {
			this.n = -1;
			this.refFilter.focus();
			this.refList.scrollToRow(0);
			this.unsetActive();
			return;
		};

		const item = items[this.n];
		if (item.isSection) {
			this.onArrow(dir);
			return;
		};

		this.refList.scrollToRow(Math.max(0, this.n));
		this.setActive(item);
	};

	setActive (item: any) {
		if (!item) {
			return;
		};

		this.n = this.getItems().findIndex(it => it.id == item.id);
		this.unsetActive();

		const node = $(this.node);
		node.find(`#item-${item.id}`).addClass('active');
	};

	unsetActive () {
		const node = $(this.node);
		node.find('.item.active').removeClass('active');
	};

	onFilterKeyUp (e: any) {
		window.clearTimeout(this.timeout);

		let ret = false;

		keyboard.shortcut('backspace', e, () => {
			const range = this.refFilter?.ref?.getRange();

			if (range && !range.to) {
				this.parsedFilters.pop();
				this.reload();
				ret = true;
			};
		});

		if (!ret) {
			this.timeout = window.setTimeout(() => {
				this.refFilter.setValue(this.parseFilter());
				this.reload();
			}, Constant.delay.keyboard * 2);
		};
	};

	onFilterClear () {
		this.parsedFilters = [];
		this.load(true);
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};

	load (clear: boolean, callBack?: (value: any) => void) {
		const filter = this.getFilter();
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
		];

		let limit = Constant.limit.menuRecords;
		let filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getFileAndSystemLayouts() },
		];
		for (let item of this.parsedFilters) {
			//filters = filters.concat(item.filters || []);
		};

		if (clear) {
			this.setState({ loading: true });
		};

		if (!filter && !this.parsedFilters.length) {
			limit = 8;
		};

		UtilData.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit,
		}, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			if (callBack) {
				callBack(null);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records || []);

			if (clear) {
				this.setState({ loading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	reload () {
		this.n = -1;
		this.offset = 0;
		this.top = 0;
		this.load(true);
	};

	parseFilter (): string {
		const filter = this.getFilter();

		if (!filter.length) {
			return;
		};

		const filterReg = new RegExp(UtilCommon.regexEscape(filter), 'gi');
		const relations = dbStore.getRelations().filter(it => !it.isHidden && it.isInstalled && (it.name.match(filterReg) || it.description.match(filterReg)));

		if (!this.newFilter) {
			this.newFilter = {
				relation: null,
				condition: I.FilterCondition.None,
				value: null,
			};
		};

		if (!this.newFilter.relation && relations.length) {
			this.menuOpen('searchObject', {
				data: {
					noFilter: true,
					filter,
					filters: [
						{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Relation }
					],
					sorts: [
						{ relationKey: 'name', type: I.SortType.Asc }
					],
					onSelect: (item: any) => {
						this.newFilter.relation = item;
						this.refFilter.setValue('');
						this.parsedFilters.push(this.newFilter);
						this.forceUpdate();

						const conditions = Relation.filterConditionsByType(item.format).filter(it => it.id != I.FilterCondition.None);

						this.menuOpen('select', {
							data: {
								value: conditions[0].id,
								options: conditions,
								onSelect: (e: any, item: any) => {
									this.newFilter.condition = item.id;
									this.forceUpdate();
								}
							}
						});
					},
				}
			});
		};
		
		return filter;
	};

	menuOpen (id: string, param: any) {
		const { getId } = this.props;
		
		let menuParam: Partial<I.MenuParam> = {
			className: 'single',
			commonFilter: true,
			element: `#${getId()} .filter`,
			/*
			recalcRect: () => { 
				const rect = UtilCommon.getSelectionRect();
				return rect ? { ...rect, y: rect.y + win.scrollTop() } : null; 
			},
			*/
			data: {
				noFilter: true,
			},
		};

		menuParam = Object.assign(menuParam, param);
		menuParam.data = Object.assign(menuParam.data, param.data);

		if (id) {
			if (!menuStore.isOpen(id)) {
				menuStore.closeAll(Constant.menuIds.search, () => menuStore.open(id, menuParam));
			} else {
				menuStore.update(id, menuParam);
			};
		};
	};

	getParsedFilters () {
		return this.parsedFilters.filter(it => it.relation);
	};

	getCondition (type: I.RelationType, condition: I.FilterCondition) {
		if (condition == I.FilterCondition.None) {
			return null;
		};

		return Relation.filterConditionsByType(type).find(it => it.id == condition);
	};

	getItems () {
		const cmd = keyboard.cmdSymbol();
		const hasRelations = keyboard.isMainEditor() || keyboard.isMainSet();

		let items = this.items.filter(this.filterMapper);
		if (items.length) {
			items.unshift({ name: translate('popupSearchRecentObjects'), isSection: true });
		};

		items = items.map(it => {
			const type = dbStore.getTypeById(it.type);

			return { 
				...it,
				caption: !type || type.isDeleted ? translate('commonDeletedType') : type.name,
				isObject: true,
			};
		});

		items.push({ id: 'add', name: translate('popupSearchCreateObject'), icon: 'plus', shortcut: [ cmd, 'N' ] });
		if (hasRelations) {
			items.push({ id: 'relation', name: translate('popupSearchAddRelation'), icon: 'relation', shortcut: [ cmd, 'Shift', 'R' ] });
		};
		return items;
	};

	filterMapper (it: any) {
		if (it.isSection) {
			return true;
		};

		const { config } = commonStore;
		return config.debug.ho ? true : !it.isHidden;
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.n = item.index;
			this.setActive(item);
		};
	};

	onClick (e: any, item: any) {
		if (!item) {
			return;
		};

		if (e.persist) {
			e.persist();
		};

		e.stopPropagation();
		this.props.close();

		if (item.isObject) {
			const filter = UtilCommon.regexEscape(this.getFilter());

			UtilObject.openEvent(e, { ...item, id: item.id });
			analytics.event('SearchResult', { index: item.index + 1, length: filter.length });
		} else {
			switch (item.id) {
				case 'add': {
					keyboard.pageCreate();
					break;
				};

				case 'relation': {
					$('#button-header-relation').trigger('click');
					window.setTimeout(() => { $('#menuBlockRelationView #item-add').trigger('click'); }, Constant.delay.menu * 2);
					break;
				};
			};
		};
	};

	getRowHeight (item: any) {
		return item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
	};

	getFilter () {
		return this.refFilter ? this.refFilter.getValue() : '';
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId, position } = this.props;
		const obj = $(`#${getId()}-innerWrap`);
		const content = obj.find('.content');
		const { wh } = UtilCommon.getWindowDimensions();
		const height = Math.min(wh - 64, HEIGHT_ITEM * LIMIT_HEIGHT);

		content.css({ height });
		position();
	};

});

export default PopupSearch;
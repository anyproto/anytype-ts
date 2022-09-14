import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input, Loader, IconObject, ObjectName, ObjectDescription, EmptySearch } from 'Component';
import { I, C, Util, DataUtil, keyboard, Key, focus, translate, analytics } from 'Lib';
import { commonStore, dbStore } from 'Store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Popup {};

interface State {
	loading: boolean;
	filter: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const HEIGHT = 32;
const LIMIT_HEIGHT = 14;

const PopupSearch = observer(class PopupSearch extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		loading: false,
		filter: '',
	};
	refFilter: any = null;
	refList: any = null;
	timeout: number = 0;
	cache: any = {};
	items: any[] = [];
	n: number = -1;
	top: number = 0;
	offset: number = 0;
	
	constructor (props: any) {
		super (props);

		this.onKeyUpSearch = this.onKeyUpSearch.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onOver = this.onOver.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.filterMapper = this.filterMapper.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { filter, loading } = this.state;
		const items = this.getItems();

		const div = (
			<div className="div">
				<div className="inner" />
			</div>
		);

		const Item = (item: any) => {
			const type = dbStore.getType(item.type);
			const description = (item.layout != I.ObjectLayout.Note) ? (item.description || item.snippet) : '';

			return (
				<div 
					id={'item-' + item.id} 
					className={[ 'item', (item.isHidden ? 'isHidden' : '') ].join(' ')} 
					onMouseOver={(e: any) => { this.onOver(e, item); }} 
					onClick={(e: any) => { this.onClick(e, item); }}
				>
					<IconObject object={item} size={18} />
					<ObjectName object={item} />

					{div}
					<div className="type">{!type || type.isDeleted ? translate('commonDeletedType') : type.name}</div>

					{description ? (
						<React.Fragment>
							{div}
							<ObjectDescription object={item} />
						</React.Fragment>
					) : ''}
				</div>
			);
		};

		const rowRenderer = ({ index, key, style, parent }) => {
			let item = items[index];
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
					hasFixedWidth={() => {}}
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				{loading ? <Loader id="loader" /> : ''}
				
				<form id="head" className="head" onSubmit={this.onSubmit}>
					<Icon key="icon-search" className="search" />
					<Input 
						ref={(ref: any) => { this.refFilter = ref; }} 
						placeholder={translate('popupSearchPlaceholder')} 
						onKeyUp={(e: any) => { this.onKeyUpSearch(e, false); }} 
					/>
				</form>

				{!items.length && !loading ? (
					<EmptySearch text={filter ? Util.sprintf(translate('popupSearchEmptyFilter'), filter) : translate('popupSearchEmpty')} />
				) : ''}
				
				{this.cache && items.length && !loading ? (
					<div key="items" className="items left">
						<InfiniteLoader
							rowCount={this.items.length + 1}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!this.items[index]}
							threshold={LIMIT_HEIGHT}
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
											rowHeight={HEIGHT}
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
		$('#header').addClass('active');
	};
	
	componentDidUpdate (prevProps: any, prevState: any) {
		const { filter } = this.state;
		const items = this.getItems();

		if (filter != prevState.filter) {
			this.n = -1;
			this.offset = 0;
			this.top = 0;
			this.load(true);
			return;
		};

		this.resize();
		this.setActive();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
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
		$('#header').removeClass('active');
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.search', (e: any) => { this.onKeyDown(e); });
		win.on('resize.search', (e: any) => { this.resize(); });
	};

	unbind () {
		$(window).off('keydown.search resize.search');
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		this.onKeyUpSearch(e, true);
	};

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	onKeyDown (e: any) {
		const items = this.getItems();
		const cmd = keyboard.ctrlKey();

		keyboard.disableMouse(true);

		let k = keyboard.eventKey(e);

		if (k == Key.tab) {
			k = e.shiftKey ? Key.up : Key.down;
		};

		if ((k == Key.down) && (this.n == -1)) {
			this.refFilter.blur();
		};

		if ((k == Key.up) && (this.n == 0)) {
			this.refFilter.focus();
			this.unsetActive();
			this.n = -1;
			return;
		};

		if ((k != Key.down) && (this.n == -1)) {
			return;
		};

		keyboard.shortcut('arrowup, arrowdown', e, (pressed: string) => {
			this.onArrow(pressed.match(Key.up) ? -1 : 1);
		});

		keyboard.shortcut(`enter, space, shift+enter, ${cmd}+enter`, e, (pressed: string) => {
			const item = items[this.n];
			if (item) {
				this.onClick(e, item);
			};
		});

		keyboard.shortcut('escape', e, (pressed: string) => {
			this.props.close();
		});
	};

	onArrow (dir: number) {
		const items = this.getItems();
		const l = items.length;

		this.n += dir;

		if (this.n < 0) {
			this.n = l - 1;
		};

		if (this.n > l - 1) {
			this.n = 0;
		};

		if (items[this.n].isSection) {
			this.onArrow(dir);
			return;
		};

		this.setActive();
		this.refList.scrollToRow(Math.max(0, this.n));
	};

	setActive (item?: any) {
		const items = this.getItems();

		if (!item) {
			item = items[this.n];
		};
		if (!item) {
			return;
		};

		this.n = items.findIndex(it => it.id == item.id);
		this.unsetActive();
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find(`#item-${item.id}`).addClass('active');
	};

	unsetActive () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.active').removeClass('active');
	};

	onKeyUpSearch (e: any, force: boolean) {
		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => { 
			this.setState({ filter: this.refFilter.getValue() }); 
		}, force ? 0 : 50);
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menu;
			this.load(false, resolve);
		});
	};

	load (clear: boolean, callBack?: (value: any) => void) {
		const { config } = commonStore;
		const { filter } = this.state;
		const skipTypes = [].concat(DataUtil.getFileTypes()).concat(DataUtil.getSystemTypes());

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: skipTypes },
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
		];

		if (clear) {
			this.setState({ loading: true });
		};

		DataUtil.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit: Constant.limit.menu,
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

			this.items = this.items.concat(message.records);

			if (clear) {
				this.setState({ loading: false });
				analytics.event('SearchQuery', { route: 'ScreenSearch', length: filter.length });
			} else {
				this.forceUpdate();
			};
		});
	};

	getItems () {
		const items = this.items.filter(this.filterMapper);
		if (items.length) {
			items.unshift({ name: 'Recent objects', isSection: true });
		};
		return items;
	};

	filterMapper (it: any) {
		if (it.isSection) {
			return true;
		};

		const { config } = commonStore;
		if (!config.debug.ho && it.isHidden) {
			return false;
		};
		return true;
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.n = item.index;
			this.setActive();
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

		const filter = Util.filterFix(this.refFilter.getValue());

		DataUtil.objectOpenEvent(e, { ...item, id: item.id });
		analytics.event('SearchResult', { index: item.index + 1, length: filter.length });
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId, param } = this.props;
		const { data } = param;
		const { isPopup } = data;
		const items = this.getItems();
		const win = $(window);
		const obj = $(`#${getId()}-innerWrap`);
		const content = obj.find('.content');
		const container = Util.getPageContainer(isPopup);
		const header = container.find('#header');
		const ww = win.width();
		const element = header.find('#path');

		let width = ww * 0.4;
		let height = Math.max(80, Math.min(HEIGHT * LIMIT_HEIGHT, items.length * HEIGHT + 16));
		let x = ww / 2 - width / 2;
		let y = Util.sizeHeader();

		if (element.length) {
			const { left, top } = element.offset();

			width = element.outerWidth();
			x = left;
			y = top - win.scrollTop() + 40;
		};

		if (!items.length) {
			height = 110;
		};

		obj.css({ width, left: x, top: y });
		content.css({ height });
	};

});

export default PopupSearch;
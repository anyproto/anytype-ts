import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Input, Loader, IconObject, Label } from 'ts/component';
import { I, C, Util, DataUtil, crumbs, keyboard, Key, focus, translate } from 'ts/lib';
import { commonStore, blockStore, detailStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Popup {
	history: any;
}

interface State {
	pageId: string;
	loading: boolean;
	filter: string;
	pages: any[];
	n: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const HEIGHT = 32;
const LIMIT = 14;

const PopupSearch = observer(class PopupSearch extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		pageId: '',
		loading: false,
		filter: '',
		pages: [] as any[],
		n: 0,
	};
	ref: any = null;
	timeout: number = 0;
	disableFirstKey: boolean = false;
	focused: boolean = false;
	cache: any = null;
	focus: boolean = false;
	select: boolean = false;
	
	constructor (props: any) {
		super (props);

		this.onKeyUpSearch = this.onKeyUpSearch.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onOver = this.onOver.bind(this);
		this.filterMapper = this.filterMapper.bind(this);
	};
	
	render () {
		const { pageId, filter, loading, n } = this.state;
		const { breadcrumbs } = blockStore;
		const object = detailStore.get(breadcrumbs, pageId, []);
		const items = this.getItems();

		const div = (
			<div className="div">
				<div className="inner" />
			</div>
		);

		let iconHome = (
			<div className="iconObject c20">
				<div className="iconEmoji c18">
					<Icon className="home" />
				</div>
			</div>
		);

		const Item = (item: any) => {
			let type = dbStore.getObjectType(item.type);
			let description = item.description;
			let name = item.name || DataUtil.defaultName('page');

			if (item.layout == I.ObjectLayout.Note) {
				name = item.snippet ? item.snippet : <span className="empty">Empty</span>;
			} else {
				description = item.description || item.snippet;
			};

			return (
				<div 
					id={'item-' + item.id} 
					className={[ 'item', (item.isHidden ? 'isHidden' : '') ].join(' ')} 
					onMouseOver={(e: any) => { this.onOver(e, item); }} 
					onClick={(e: any) => { this.onClick(e, item); }}
				>
					{item.isRoot ? iconHome : <IconObject object={item} size={18} />}
					
					<div className="name">{name}</div>

					{type ? (
						<React.Fragment>
							{div}
							<div className="type descr">{type.name || DataUtil.defaultName('page')}</div>
						</React.Fragment>
					) : ''}

					{description ? (
						<React.Fragment>
							{div}
							<div className="descr">{description}</div>
						</React.Fragment>
					) : ''}
				</div>
			);
		};

		const rowRenderer = ({ index, key, style, parent }) => {
			const item = items[index];
			return (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={index}
					hasFixedWidth={() => {}}
				>
					{item.isSection ? (
						<div className="section" style={style}>
							<div className="name">{item.name}</div>
						</div>
					) : (
						<div className="row" style={style}>
							<Item {...item} index={index} />
						</div>
					)}
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				{loading ? <Loader /> : ''}
				
				<form id="head" className="head" onSubmit={this.onSubmit}>
					 <Icon key="icon-search" className="search" />
					<Input 
						ref={(ref: any) => { this.ref = ref; }} 
						value={object.name} 
						placeholder={translate('popupSearchPlaceholder')} 
						onKeyUp={(e: any) => { this.onKeyUpSearch(e, false); }} 
						onFocus={this.onFocus}
						onBlur={this.onBlur}
					/>
				</form>

				{!items.length && !loading ? (
					<div id="empty" key="empty" className="emptySearch">
						<Label text={Util.sprintf(translate('popupSearchEmptyFilter'), filter)} />
					</div>
				) : ''}
				
				{this.cache && items.length && !loading ? (
					<div key="items" className="items left">
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={() => {}}
							isRowLoaded={({ index }) => index < items.length}
						>
							{({ onRowsRendered, registerChild }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={registerChild}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={HEIGHT}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
											scrollToIndex={n}
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
		const { param } = this.props;
		const { data } = param;
		const { rootId, disableFirstKey } = data;

		this.disableFirstKey = Boolean(disableFirstKey);
		this._isMounted = true;

		crumbs.addPage(rootId);
		this.focus = true;
		this.select = true;

		this.setState({ pageId: rootId });
		this.load();
		this.rebind();
		this.resize();

		focus.clear(true);
	};
	
	componentDidUpdate (prevProps: any, prevState: any) {
		const { filter } = this.state;

		if (filter != prevState.filter) {
			this.load();
			return;
		};

		this.setActive();

		if (this.ref) {
			if (this.focus) {
				this.ref.focus();
			};
			if (this.select) {
				this.ref.select();
				this.select = false;
			};
		};

		const items = this.getItems();
		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeout);
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.search', (e: any) => { this.onKeyDown(e); });
	};

	unbind () {
		$(window).unbind('keydown.search resize.search');
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		this.onKeyUpSearch(e, true);
	};

	onFocus () {
		this.focused = true;
	};

	onBlur () {
		this.focused = false;
	};

	onKeyDown (e: any) {
		const items = this.getItems();
		const l = items.length;

		let { n } = this.state;
		let k = e.key.toLowerCase();

		keyboard.disableMouse(true);

		if (k == Key.tab) {
			k = e.shiftKey ? Key.up : Key.down;
		};

		if ([ Key.left, Key.right ].indexOf(k) >= 0) {
			return;
		};

		if ((k == Key.down) && (n == -1)) {
			this.ref.blur();
			this.focus = false;
			this.disableFirstKey = true;
		};

		if ((k == Key.up) && (n == 0)) {
			this.ref.focus();
			this.ref.select();
			this.disableFirstKey = true;
			this.unsetActive();
			this.setState({ n: -1 });
			return;
		};

		if ((k != Key.down) && this.focused) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();

		switch (k) {
			case Key.up:
				n--;
				if (n < 0) {
					n = l - 1;
				};
				this.setState({ n: n });
				this.setActive();
				break;
				
			case Key.down:
				n++;
				if (n > l - 1) {
					n = 0;
				};
				this.setState({ n: n });
				this.setActive();
				break;

			case Key.enter:
			case Key.space:
				const item = items[n];
				if (!item) {
					break;
				};

				this.onClick(e, item);
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};

	setActive (item?: any) {
		const { n } = this.state;
		if (!item) {
			const items = this.getItems();
			item = items[n];
		};

		if (!item) {
			return;
		};

		this.unsetActive();
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find(`#item-${item.id}`).addClass('active');
	};

	unsetActive () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.active').removeClass('active');
	};

	onOver (e: any, item: any) {
		const { n } = this.state;
		
		if (!keyboard.isMouseDisabled && (item.index != n)) {
			this.setState({ n: item.index });
		};
	};

	onKeyUpSearch (e: any, force: boolean) {
		if (this.disableFirstKey) {
			this.disableFirstKey = false;
			return;
		};

		window.clearTimeout(this.timeout);
		this.timeout = window.setTimeout(() => {
			this.setState({ filter: Util.filterFix(this.ref.getValue()) });
		}, force ? 0 : 50);
	};

	load () {
		const { config } = commonStore;
		const { filter } = this.state;
		
		let skipLayouts = [ I.ObjectLayout.File, I.ObjectLayout.Image, I.ObjectLayout.Video ];

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: skipLayouts },
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
		];

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false });
		};

		this.setState({ loading: true, n: -1 });

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter, 0, 0, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			if (this.ref) {
				this.ref.focus();
			};
			
			const pages = message.records;
			this.setState({ pages: pages, loading: false });
		});
	};

	getItems () {
		const { root } = blockStore;
		const pages = Util.objectCopy(this.state.pages);
		const recent = crumbs.get(I.CrumbsType.Recent).ids;

		for (let page of pages) {
			page.order = recent.findIndex((id: string) => { return id == page.id; });
		};

		pages.sort((c1: any, c2: any) => {
			if (c1.order > c2.order) return -1;
			if (c2.order < c1.order) return 1;
			return 0;
		});

		return pages.map((it: any) => {
			return { 
				...it, 
				isRoot: it.id == root, 
				name: String(it.name || '') 
			};
		});
	};

	filterMapper (it: any) {
		if (it.isSection) {
			return true;
		};

		const { param } = this.props;
		const { data } = param;
		const { skipId, rootId } = data;
		const { config } = commonStore;
		
		if (it.isArchived) {
			return false;
		};
		if (skipId && (it.id == skipId)) {
			return false;
		};
		if (it.id == rootId) {
			return false;
		};
		if (it.layout == I.ObjectLayout.Dashboard) {
			return false;
		};
		if (!config.debug.ho && it.isHidden) {
			return false;
		};
		return true;
	};

	onClick (e: any, item: any) {
		if (e.persist) {
			e.persist();
		};
		e.stopPropagation();

		const { param, close } = this.props;
		const { data } = param;
		const { rootId, type, blockId, blockIds, position } = data;

		close();

		let newBlock: any = {};
		switch (type) {
			case I.NavigationType.Go:
				crumbs.cut(I.CrumbsType.Page, 0, () => {
					DataUtil.objectOpenEvent(e, { ...item, id: item.id });
				});
				break;

			case I.NavigationType.Move:
				C.BlockListMove(rootId, item.id, blockIds, '', I.BlockPosition.Bottom);
				break;

			case I.NavigationType.Link:
				newBlock = {
					type: I.BlockType.Link,
					content: {
						targetBlockId: String(item.id || ''),
					}
				};
				C.BlockCreate(newBlock, rootId, blockId, position);
				break;

			case I.NavigationType.LinkTo:
				newBlock = {
					type: I.BlockType.Link,
					content: {
						targetBlockId: blockId,
					}
				};
				C.BlockCreate(newBlock, item.id, '', position);
				break;
		};
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const height = Math.max(100, Math.min(HEIGHT * LIMIT, items.length * HEIGHT + 16));

		obj.css({ height: height });
	};

});

export default PopupSearch;
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Button, Input, Cover, Loader, IconObject } from 'ts/component';
import { I, C, Util, DataUtil, crumbs, keyboard, Key, focus, translate } from 'ts/lib';
import { commonStore, blockStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Popup {
	history: any;
};

interface State {
	pageId: string;
	showIcon: boolean;
	loading: boolean;
	filter: string;
	pages: I.PageInfo[];
	n: number;
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');
const HEIGHT = 32;
const HEIGHT_EXPANDED = 96;

enum Panel { 
	Left = 1, 
	Center = 2, 
	Right = 3,
};

@observer
class PopupSearch extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		pageId: '',
		showIcon: false,
		loading: false,
		filter: '',
		pages: [] as I.PageInfo[],
		n: 0,
	};
	ref: any = null;
	timeout: number = 0;
	disableFirstKey: boolean = false;
	panel: Panel = Panel.Left;
	focused: boolean = false;
	cache: any = {};
	focus: boolean = false;
	select: boolean = false;
	
	constructor (props: any) {
		super (props);

		this.onKeyDownSearch = this.onKeyDownSearch.bind(this);
		this.onKeyUpSearch = this.onKeyUpSearch.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onConfirm = this.onConfirm.bind(this);
		this.onFocus = this.onFocus.bind(this);
		this.onBlur = this.onBlur.bind(this);
		this.onOver = this.onOver.bind(this);
	};
	
	render () {
		const { pageId, filter, loading, showIcon, n } = this.state;
		const { param, close } = this.props;
		const { data } = param;
		const { type, rootId, blockId } = data;
		const { root, breadcrumbs } = blockStore;
		const details = blockStore.getDetails(breadcrumbs, pageId);
		const isRoot = pageId == root;
		const pages = this.getItems();

		const div = (
			<div className="div">
				<div className="inner" />
			</div>
		);

		let iconSearch = null;
		let iconHome = (
			<div className="iconObject c20">
				<div className="iconEmoji c18">
					<Icon className="home" />
				</div>
			</div>
		);

		if (showIcon) {
			if (isRoot) {
				iconSearch = <Icon key="icon-home" className="home big" />;
			} else {
				iconSearch = <IconObject object={details} />;
			};
		} else {
			iconSearch = <Icon key="icon-search" className="search" />;
		};

		const Item = (item: any) => {
			let { name } = item.details || {};
			let isRoot = item.id == root;
			let objectType = dbStore.getObjectType(item.details.type, '');

			return (
				<div id={'item-' + item.id} className="item" onMouseOver={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
					{isRoot ? iconHome : <IconObject object={item.details} size={18} /> }
					
					{name ? (
						<div className="element">
							<div className="name element">{name}</div>
							{div}
						</div>
					) : ''}

					{objectType ? (
						<div className="element">
							<div className="descr">{objectType.name}</div>
							{div}
						</div>
					) : ''}

					{item.snippet ? (
						<div className="element">
							<div className="descr">{item.snippet}</div>
							{div}
						</div>
					) : ''}
				</div>
			);
		};

		const rowRenderer = (list: I.PageInfo[], cache: any, { index, key, style, parent, panel }) => {
			return (
				<CellMeasurer
					key={key}
					parent={parent}
					cache={cache}
					columnIndex={0}
					rowIndex={index}
					hasFixedWidth={() => {}}
				>
					<div className="row" style={style}>
						<Item {...list[index]} index={index} panel={panel} />
					</div>
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				{loading ? <Loader /> : ''}
				
				<form id="head" className="head" onSubmit={this.onSubmit}>
					{iconSearch}
					<Input 
						ref={(ref: any) => { this.ref = ref; }} 
						value={details.name} 
						placeHolder={translate('popupNavigationPlaceholder')} 
						onKeyDown={this.onKeyDownSearch} 
						onKeyUp={(e: any) => { this.onKeyUpSearch(e, false); }} 
						onFocus={this.onFocus}
						onBlur={this.onBlur}
					/>
				</form>

				{!pages.length && !loading ? (
					<div id="empty" key="empty" className="empty">
						<div 
							className="txt" 
							dangerouslySetInnerHTML={{ __html: Util.sprintf(translate('popupNavigationEmptyFilter'), filter) }} 
						/>
					</div>
				) : (
					<div id={'panel-' + Panel.Left} key="items" className="items left">
						<InfiniteLoader
							rowCount={pages.length}
							loadMoreRows={() => {}}
							isRowLoaded={({ index }) => index < pages.length}
						>
							{({ onRowsRendered, registerChild }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={registerChild}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={pages.length}
											rowHeight={HEIGHT}
											rowRenderer={(param: any) => { 
												param.panel = Panel.Left;
												return rowRenderer(pages, this.cache, param); 
											}}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
											scrollToIndex={n}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					</div>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, disableFirstKey } = data;

		this.disableFirstKey = Boolean(disableFirstKey);
		this._isMounted = true;

		this.setCrumbs(rootId);
		this.resize();
		this.initSearch(rootId);
		this.focus = true;
		this.select = true;

		this.setState({ pageId: rootId, showIcon: true });
		this.load();
		this.rebind();

		focus.clear(true);
	};
	
	componentDidUpdate (prevProps: any, prevState: any) {
		const { pages, filter } = this.state;

		if (filter != prevState.filter) {
			this.load();
			return;
		};

		this.resize();
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

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (pages[i] || {}).id; },
		});
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
		win.on('keydown.navigation', (e: any) => { this.onKeyDown(e); });
		win.unbind('resize.navigation').on('resize.navigation', () => { this.resize(); });
	};

	unbind () {
		$(window).unbind('keydown.navigation resize.navigation');
	};
	
	initSearch (id: string) {
		if (!id) {
			return;
		};

		const { root, breadcrumbs } = blockStore;
		const details = blockStore.getDetails(breadcrumbs, id);
		const isRoot = id == root;

		if (this.ref) {
			this.ref.setValue(isRoot ? 'Home' : details.name);
			this.ref.select();
		};
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		raf(() => {
		});
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

			case Key.left:
				this.setState({ n: 0 });
				this.panel--;
				if (this.panel < Panel.Left) {
					this.panel = Panel.Right;
				};

				if ((this.panel == Panel.Left) && !this.getItems().length) {
					this.panel = Panel.Right;
				};
				if ((this.panel == Panel.Right) && !this.getItems().length) {
					this.panel = Panel.Center;
				};

				this.setActive();
				break;
				
			case Key.right:
				this.setState({ n: 0 });
				this.panel++;
				if (this.panel > Panel.Right) {
					this.panel = Panel.Left;
				};
				
				if ((this.panel == Panel.Left) && !this.getItems().length) {
					this.panel = Panel.Center;
				};
				if ((this.panel == Panel.Right) && !this.getItems().length) {
					this.panel = Panel.Left;
				};

				this.setActive();
				break;
				
			case Key.enter:
			case Key.space:
				const item = items[n];
				if (!item) {
					break;
				};

				this.onConfirm(e, item);
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};

	getItems () {
		const { pages } = this.state;
		return pages;
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

		if (item.panel) {
			this.panel = item.panel;
		};

		this.unsetActive();
		
		const node = $(ReactDOM.findDOMNode(this));
		node.find(`#panel-${this.panel} #item-${item.id}`).addClass('active');
	};

	unsetActive () {
		const node = $(ReactDOM.findDOMNode(this));
		node.find('.active').removeClass('active');
	};

	onOver (e: any, item: any) {
		const { n } = this.state;
		
		if (!keyboard.isMouseDisabled && ((item.panel != this.panel) || (item.index != n))) {
			this.panel = item.panel;
			this.setState({ n: item.index });
		};
	};

	onKeyDownSearch (e: any) {
		const { showIcon } = this.state;
		const newState: any = {};

		if (showIcon) {
			newState.showIcon = false;
		};
		if (Util.objectLength(newState)) {
			this.setState(newState);
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
		const { param } = this.props;
		const { data } = param;
		const { type, skipId } = data;
		const { filter } = this.state;
		const { config } = commonStore;
		const { root } = blockStore;

		this.setState({ loading: true, n: -1 });
		this.panel = Panel.Left;

		let pages: I.PageInfo[] = [];
		C.NavigationListObjects(type, filter, 0, 100000000, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			for (let page of message.objects) {
				if ((skipId && (page.id == skipId)) || page.id == root) {
					continue;
				};

				page = this.getPage(page);
				if (!this.filterMapper(page, config)) {
					continue;
				};

				pages.push(page);
			};

			if (this.ref) {
				this.ref.focus();
			};
			this.setState({ pages: pages, loading: false });
		});
	};

	filterMapper (it: I.PageInfo, config: any) {
		if (it.details.isArchived || (!config.allowDataview && (it.details.layout == I.ObjectLayout.Set))) {
			return false;
		};
		return true;
	};

	setCrumbs (id: string) {
		let cr = crumbs.get(I.CrumbsType.Page);
		cr = crumbs.add(I.CrumbsType.Page, id);
		crumbs.save(I.CrumbsType.Page, cr);
	};
	
	onClick (e: any, item: I.PageInfo) {
		e.stopPropagation();
		this.onConfirm(e, item);
	};

	onConfirm (e: any, item: I.PageInfo) {
		const { param, history } = this.props;
		const { data } = param;
		const { rootId, type, blockId, blockIds, position } = data;
		const { root } = blockStore;

		if (!this.withButtons(item)) {
			return;
		};

		switch (type) {
			case I.NavigationType.Go:
				crumbs.cut(I.CrumbsType.Page, 0, () => {
					if (item.id == root) {
						history.push('/main/index');
					} else {
						DataUtil.pageOpen(item.id);
					};
				});
				break;

			case I.NavigationType.Move:
				C.BlockListMove(rootId, item.id, blockIds, '', I.BlockPosition.Bottom);
				break;

			case I.NavigationType.Link:
				const param = {
					type: I.BlockType.Link,
					content: {
						targetBlockId: String(item.id || ''),
					}
				};
				C.BlockCreate(param, rootId, blockId, position);
				break;
		};

		this.props.close();
	};

	withButtons (item: I.PageInfo) {
		const { param } = this.props;
		const { data } = param;
		const { type, rootId, blockId, blockIds } = data;
		const { root } = blockStore;

		let isRoot = item.id == root;
		let isSelf = (item.id == rootId) || (item.id == blockId);
		let ret = true;

		if (isSelf && ([ I.NavigationType.Move, I.NavigationType.Link ].indexOf(type) >= 0)) {
			ret = false;
		};

		if (isRoot && (type != I.NavigationType.Go)) {
			ret = false;
		};

		if (type == I.NavigationType.Move) {
			for (let id of blockIds) {
				let block = blockStore.getLeaf(rootId, id);
				if (isRoot && (block.type != I.BlockType.Link)) {
					ret = false;
					break;
				};
				if ((block.type == I.BlockType.Link) && (item.id == block.content.targetBlockId)) {
					ret = false;
					break;
				};
			};
		};

		return ret;
	};

	getPage (page: any): I.PageInfo {
		page.details.name = String(page.details.name || Constant.default.name || '');

		return {
			...page,
			text: [ page.details.name, page.snippet ].join(' '),
		};
	};
	
};

export default PopupSearch;
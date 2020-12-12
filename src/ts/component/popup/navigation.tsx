import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Icon, Button, Input, Cover, Loader, IconObject } from 'ts/component';
import { I, C, Util, DataUtil, crumbs, keyboard, Key, focus, translate } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Popup {
	history: any;
};

interface State {
	pageId: string;
	showIcon: boolean;
	expanded: boolean;
	loading: boolean;
	filter: string;
	pages: I.PageInfo[];
	info: I.PageInfo;
	pagesIn: I.PageInfo[];
	pagesOut: I.PageInfo[];
	n: number;
};

const $ = require('jquery');
const raf = require('raf');
const Constant = require('json/constant.json');
const HEIGHT = 64;
const HEIGHT_EXPANDED = 96;

enum Panel { 
	Left = 1, 
	Center = 2, 
	Right = 3,
};

@observer
class PopupNavigation extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		pageId: '',
		showIcon: false,
		expanded: false,
		loading: false,
		filter: '',
		pages: [] as I.PageInfo[],
		info: null,
		pagesIn: [] as I.PageInfo[],
		pagesOut: [] as I.PageInfo[],
		n: 0,
	};
	ref: any = null;
	timeout: number = 0;
	disableFirstKey: boolean = false;
	panel: Panel = Panel.Left;
	focused: boolean = false;
	cache: any = {};
	cacheIn: any = {};
	cacheOut: any = {};
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
		const { pageId, expanded, filter, info, pagesIn, pagesOut, loading, showIcon, n } = this.state;
		const { param, close } = this.props;
		const { data } = param;
		const { type, rootId, blockId } = data;
		const { root, breadcrumbs } = blockStore;
		const details = blockStore.getDetails(breadcrumbs, pageId);
		const isRoot = pageId == root;
		const pages = this.getItems();

		/*
		if ((expanded && (!this.cacheIn || !this.cacheOut)) || (!expanded && !this.cache)) {
			return null;
		};
		*/

		let confirm = '';
		let iconSearch = null;
		let iconHome = (
			<div className="iconObject c48">
				<div className="iconEmoji c48">
					<Icon className="home big" />
				</div>
			</div>
		);

		if (showIcon) {
			if (isRoot) {
				iconSearch = <Icon key="icon-home" className="home" />;
			} else {
				iconSearch = <IconObject object={details} />;
			};
		} else {
			iconSearch = <Icon key="icon-search" className="search" />;
		};

		switch (type) {
			default:
			case I.NavigationType.Go:
				confirm = translate('popupNavigationOpen');
				break;

			case I.NavigationType.Move:
				confirm = translate('popupNavigationMove');
				break;

			case I.NavigationType.Link:
				confirm = translate('popupNavigationLink');
				break;
		};

		const head = (
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
		);

		const Item = (item: any) => {
			let { name } = item.details || {};
			let isRoot = item.id == root;

			return (
				<div id={'item-' + item.id} className="item" onMouseOver={(e: any) => { this.onOver(e, item); }}>
					<div className="inner" onClick={(e: any) => { this.onClick(e, item); }}>
						{isRoot ? iconHome : <IconObject object={item.details} className="c48" size={24} /> }
						<div className="info">
							<div className="name">{name}</div>
							<div className="descr">{item.snippet}</div>
						</div>
					</div>
					<Icon className="arrow" onClick={(e: any) => { this.onClickArrow(e, item); }} />
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

		const ItemEmpty = (item: any) => {
			return (
				<div className="item empty">
					<div className="name">{item.name}</div>
					<Icon className="arrow" />
				</div>
			);
		};

		const Selected = (item: any) => {
			let { name, coverType, coverId, coverX, coverY, coverScale } = item.details;
			let isRoot = item.id == root;
			let icon = null;
			let withScale = true;
			let withButtons = this.withButtons(item);

			if (isRoot) {
				icon = iconHome;
				name = 'Home';
				
				if (!coverId && !coverType) {
					coverId = 'c' + Constant.default.cover;
					coverType = I.CoverType.BgImage;
				};
				withScale = false;
			} else {
				icon = <IconObject object={item.details} className="c48" size={24} />
			};

			return (
				<div id={'item-' + item.id} className="selected">
					{icon}
					<div className="name">{name}</div>
					<div className="descr">{item.snippet}</div>
					{coverId && coverType ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={withScale} /> : ''}
					{withButtons ? (
						<div className="buttons">
							<Button text={confirm} className="orange" onClick={(e: any) => { this.onConfirm(e, item); }} />
							<Button text={translate('popupNavigationCancel')} className="blank" onClick={(e: any) => { close(); }} />
						</div>
					) : ''}
				</div>
			);
		};

		return (
			<div>
				{loading ? <Loader /> : ''}
				{expanded ? (
					<React.Fragment>
						<div key="sides" className="sides">
							<div id={'panel-' + Panel.Left} className="items left">
								{!isRoot ? (
									<React.Fragment>
										<div className="sideName">{translate('popupNavigationLinkFrom')}</div>
										{!pagesIn.length ? (
											<ItemEmpty name={translate('popupNavigationEmptyTo')} />
										) : (
											<InfiniteLoader
												rowCount={pagesIn.length}
												loadMoreRows={() => {}}
												isRowLoaded={({ index }) => index < pagesIn.length}
											>
												{({ onRowsRendered, registerChild }) => (
													<AutoSizer className="scrollArea">
														{({ width, height }) => (
															<List
																ref={registerChild}
																width={width + 20}
																height={height - 35}
																deferredMeasurmentCache={this.cacheIn}
																rowCount={pagesIn.length}
																rowHeight={HEIGHT_EXPANDED}
																rowRenderer={(param: any) => { 
																	param.panel = Panel.Left;
																	return rowRenderer(pagesIn, this.cacheIn, param); 
																}}
																onRowsRendered={onRowsRendered}
																overscanRowCount={10}
																scrollToIndex={this.panel == Panel.Left ? n : 0}
															/>
														)}
													</AutoSizer>
												)}
											</InfiniteLoader>
										)}
									</React.Fragment>
								) : ''}
							</div>

							<div id={'panel-' + Panel.Center} className="items center">
								{info ? <Selected {...info} /> : ''}
							</div>

							<div id={'panel-' + Panel.Right} className="items right">
								<div className="sideName">{translate('popupNavigationLinkTo')}</div>
								{!pagesOut.length ? (
									<ItemEmpty name={translate('popupNavigationEmptyFrom')} />
								) : (
									<InfiniteLoader
										rowCount={pagesOut.length}
										loadMoreRows={() => {}}
										isRowLoaded={({ index }) => index < pagesOut.length}
									>
										{({ onRowsRendered, registerChild }) => (
											<AutoSizer className="scrollArea">
												{({ width, height }) => (
													<List
														ref={registerChild}
														width={width + 20}
														height={height - 35}
														deferredMeasurmentCache={this.cacheOut}
														rowCount={pagesOut.length}
														rowHeight={HEIGHT_EXPANDED}
														rowRenderer={(param: any) => { 
															param.panel = Panel.Right;
															return rowRenderer(pagesOut, this.cacheOut, param); 
														}}
														onRowsRendered={onRowsRendered}
														overscanRowCount={10}
														scrollToIndex={this.panel == Panel.Right ? n : 0}
													/>
												)}
											</AutoSizer>
										)}
									</InfiniteLoader>
								)}
							</div>
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						{head}

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
					</React.Fragment>
				)}
			</div>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { expanded, rootId, disableFirstKey } = data;

		this.disableFirstKey = Boolean(disableFirstKey);
		this._isMounted = true;

		this.setCrumbs(rootId);
		this.initSize(expanded);
		this.initSearch(rootId);
		this.focus = true;
		this.select = true;

		this.setState({ pageId: rootId, expanded: expanded, showIcon: true });
		this.loadSearch();
		
		if (expanded) {
			this.loadPage(rootId);
		};

		this.rebind();
		focus.clear(true);
	};
	
	componentDidUpdate (prevProps: any, prevState: any) {
		const { expanded, pages, pagesIn, pagesOut, filter } = this.state;

		if (filter != prevState.filter) {
			this.loadSearch();
			return;
		};

		this.initSize(expanded);
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

		this.cacheIn = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (pagesIn[i] || {}).id; },
		});

		this.cacheOut = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (pagesOut[i] || {}).id; },
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
	
	initSize (expanded: boolean) {
		if (!this._isMounted) {
			return;
		};

		const obj = $('#popupNavigation #innerWrap');
		expanded ? obj.addClass('expanded') : obj.removeClass('expanded');
		this.resize();
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

		const platform = Util.getPlatform();

		raf(() => {
			const { expanded } = this.state;
			const win = $(window);
			const obj = $('#popupNavigation #innerWrap');
			const items = obj.find('.items');
			const sides = obj.find('.sides');
			const empty = obj.find('#empty');
			const offset = expanded ? 32 : 0;
			const wh = win.height();
			const ww = win.width();
			
			let oh = wh - 70;
			if ([ I.Platform.Windows ].indexOf(platform) >= 0) {
				oh -= 16;
			};

			let sh = oh - offset;
			let width = expanded ? Math.min(1136, Math.max(896, ww - 128)) : 400;

			sides.css({ height: sh });
			items.css({ height: sh });
			empty.css({ height: sh, lineHeight: sh + 'px' });
			obj.css({ width: width, marginLeft: -width / 2, marginTop: 0, height: oh });
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

		let { expanded, n } = this.state;
		let k = e.key.toLowerCase();

		keyboard.disableMouse(true);

		if (!expanded) {
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
		} else {
			if (k == Key.tab) {
				k = e.shiftKey ? Key.left : Key.right;
			};
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

				if (this.panel == Panel.Center) {
					this.onConfirm(e, item);
				} else {
					this.loadPage(item.id);
				};
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};

	getItems () {
		const { info, pages, pagesIn, pagesOut, expanded } = this.state;

		if (expanded) {
			switch (this.panel) {
				case Panel.Left:
					return pagesIn;
				
				case Panel.Center:
					return [ info ];
	
				case Panel.Right:
					return pagesOut;
			};
		} else {
			return pages;
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
		const { expanded, showIcon } = this.state;
		const newState: any = {};

		if (expanded) {
			newState.expanded = false;
		};
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

	loadSearch () {
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

	loadPage (id: string) {
		const { config } = commonStore;
		const filter = (it: I.PageInfo) => { return this.filterMapper(it, config); };

		this.setState({ loading: true });
		this.setCrumbs(id);

		C.NavigationGetObjectInfoWithLinks(id, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			let pagesIn = message.object.links.inbound.map((it: any) => { return this.getPage(it); });
			let pagesOut = message.object.links.outbound.map((it: any) => { return this.getPage(it); });

			pagesIn = pagesIn.filter(filter);
			pagesOut = pagesOut.filter(filter);

			this.panel = Panel.Center;
			this.initSearch(id);
			this.setState({ 
				n: 0,
				pageId: id,
				loading: false,
				expanded: true, 
				info: this.getPage(message.object.info),
				pagesIn: pagesIn,
				pagesOut: pagesOut,
			});
		});
	};

	filterMapper (it: I.PageInfo, config: any) {
		if (it.details.isArchived || (!config.allowDataview && (it.pageType == I.PageType.Set))) {
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
		const { expanded } = this.state;

		e.stopPropagation();
		expanded ? this.loadPage(item.id) : this.onConfirm(e, item);
	};

	onClickArrow (e: any, item: I.PageInfo) {
		const { expanded } = this.state;
		if (!expanded) {
			this.loadPage(item.id);
		};
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

	onSearch () {
		this.setState({ expanded: false });
	};
	
	getPage (page: any): I.PageInfo {
		page.details.name = String(page.details.name || Constant.default.name || '');

		return {
			...page,
			text: [ page.details.name, page.snippet ].join(' '),
		};
	};
	
};

export default PopupNavigation;
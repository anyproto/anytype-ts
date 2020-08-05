import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Smile, Icon, Button, Input, Cover, Loader } from 'ts/component';
import { I, C, Util, DataUtil, crumbs, Key, focus } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

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
	pageLeft: number;
	pageRight: number;
};

const $ = require('jquery');
const raf = require('raf');
const FlexSearch = require('flexsearch');
const Constant = require('json/constant.json');
const PAGE = 30;

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
		pageLeft: 0,
		pageRight: 0,
	};
	ref: any = null;
	timeout: number = 0;
	index: any = null;
	disableFirstKey: boolean = false;
	n: number = 0;
	panel: Panel = Panel.Left;
	
	constructor (props: any) {
		super (props);
		
		this.onKeyDownSearch = this.onKeyDownSearch.bind(this);
		this.onKeyUpSearch = this.onKeyUpSearch.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onConfirm = this.onConfirm.bind(this);
	};
	
	render () {
		const { pageId, expanded, filter, info, pagesIn, pagesOut, loading, pageLeft, pageRight, showIcon } = this.state;
		const { param, close } = this.props;
		const { data } = param;
		const { type } = data;
		const { root, breadcrumbs } = blockStore;
		const details = blockStore.getDetails(breadcrumbs, pageId);
		const isRoot = pageId == root;
		const page = pageLeft;

		let n = 0;
		let confirm = '';
		let pages = this.state.pages || [];
		let iconSearch = null;

		if (showIcon) {
			if (isRoot) {
				iconSearch = <Icon key="icon-home" className="home" />;
			} else {
				iconSearch = <Smile icon={details.iconEmoji} hash={details.iconImage} />;
			};
		} else {
			iconSearch = <Icon key="icon-search" className="search" />;
		};

		switch (type) {
			default:
			case I.NavigationType.Go:
				confirm = 'Open';
				break;

			case I.NavigationType.Move:
				confirm = 'Move to';
				break;

			case I.NavigationType.Create:
				confirm = 'Link';
				break;
		};

		const head = (
			<form id="head" className="head" onSubmit={this.onSubmit}>
				{iconSearch}
				<Input ref={(ref: any) => { this.ref = ref; }} value={details.name} placeHolder="Search for a page..." onKeyDown={this.onKeyDownSearch} onKeyUp={(e: any) => { this.onKeyUpSearch(e, false); }} />
			</form>
		);

		if (filter) {
			const ids = this.index ? this.index.search(filter) : [];
			if (ids.length) {
				pages = pages.filter((it: I.PageInfo) => { return ids.indexOf(it.id) >= 0; });
			} else {
				const reg = new RegExp(filter.split(' ').join('[^\s]*|') + '[^\s]*', 'i');
				pages = pages.filter((it: I.PageInfo) => { return it.text.match(reg); });
			};
		};

		const Item = (item: any) => {
			let { iconEmoji, iconImage, name } = item.details;
			let isRoot = item.id == root;

			return (
				<div id={'item-' + item.id} className="item">
					<div className="inner" onClick={(e: any) => { this.onClick(e, item); }}>
						{isRoot ? (
							<div className="smile c48">
								<Icon className="home big" />
							</div>
						) : (
							<Smile icon={iconEmoji} hash={iconImage} className="c48" size={24} />
						)}
						<div className="info">
							<div className="name">{name}</div>
							<div className="descr">{item.snippet}</div>
						</div>
					</div>
					<Icon className="arrow" onClick={(e: any) => { this.onClickArrow(e, item); }} />
				</div>
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
			let { iconEmoji, iconImage, name, coverType, coverId, coverX, coverY, coverScale } = item.details;
			let isRoot = item.id == root;
			let icon = null;
			let withScale = true;

			if (isRoot) {
				icon = (
					<div className="smile c48">
						<Icon className="home big" />
					</div>
				);
				
				if (!coverId && !coverType) {
					coverId = 'c' + Constant.default.cover;
					coverType = I.CoverType.BgImage;
				};

				withScale = false;
			} else {
				icon = <Smile icon={iconEmoji} hash={iconImage} className="c48" size={24} />
			};
			
			return (
				<div id={'item-' + item.id} className="selected">
					{icon}
					<div className="name">{name}</div>
					<div className="descr">{item.snippet}</div>
					{coverId && coverType ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={withScale} /> : ''}
					<div className="buttons">
						<Button text={confirm} className="orange" onClick={(e: any) => { this.onConfirm(e, item); }} />
						<Button text="Cancel" className="blank" onClick={(e: any) => { close(); }} />
					</div>
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
										<div className="sideName">Link from page</div>
										{!pagesIn.length ? (
											<ItemEmpty name="No links to this page" />
										) : (
											<React.Fragment>
												{pagesIn.map((item: any, i: number) => {
													return <Item key={i} {...item} />;
												})}
											</React.Fragment>
										)}
									</React.Fragment>
								) : ''}
							</div>
							<div id={'panel-' + Panel.Center} className="items center">
								{info ? <Selected {...info} /> : ''}
							</div>
							<div id={'panel-' + Panel.Right} className="items right">
								<div className="sideName">Link to page</div>
								{!pagesOut.length ? (
									<ItemEmpty name="No links to other pages" />
								) : (
									<React.Fragment>
										{pagesOut.map((item: any, i: number) => {
											return <Item key={i} {...item} />;
										})}
									</React.Fragment>
								)}
							</div>
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						{head}

						{!pages.length && !loading ? (
							<div id="empty" key="empty" className="empty">
								<div className="txt">
									<b>There are no pages named "{filter}"</b>
									Try creating a new one or search for something else.
								</div>
							</div>
						) : (
							<div key="items" className="items left">
								{pages.map((item: any, i: number) => {
									if (++n > (page + 1) * PAGE) {
										return null;
									};

									return <Item key={i} {...item} />;
								})}
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

		this.setState({ pageId: rootId, expanded: expanded, showIcon: true });
		this.loadSearch();
		
		if (expanded) {
			this.loadPage(rootId);
			this.rebind();
		};

		focus.clear(true);
	};
	
	componentDidUpdate () {
		const { expanded } = this.state;
		this.initSize(expanded);

		if (expanded) {
			this.setActive();
		};
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
		obj.find('.items.left').unbind('scroll.navigation').on('scroll.navigation', (e: any) => { this.onScroll(Panel.Left); });
		obj.find('.items.right').unbind('scroll.navigation').on('scroll.navigation', (e: any) => { this.onScroll(Panel.Right); });
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

	onScroll (panel: Panel) {
		const { expanded } = this.state;

		const node = $(ReactDOM.findDOMNode(this));
		const content = panel == Panel.Left ? node.find('.items.left') : node.find('.items.right');
		const stateKey = panel == Panel.Left ? 'pageLeft' : 'pageRight';
		const top = content.scrollTop();
		const page = this.state[stateKey];
		const height = expanded ? 80 : 48;

		if (top >= page * PAGE * height) {
			let newState = {};
			newState[stateKey] = page + 1;

			this.setState(newState);
		};
	};
	
	resize () {
		if (!this._isMounted) {
			return;
		};

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
			const oh = wh - 70;
			const sh = oh - offset;
			const width = expanded ? Math.min(1136, Math.max(896, ww - 128)) : 400;

			sides.css({ height: sh });
			items.css({ height: sh });
			empty.css({ height: sh, lineHeight: sh + 'px' });
			obj.css({ width: width, marginLeft: -width / 2, marginTop: 0, top: 38, height: oh });
		});
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		this.onKeyUpSearch(e, true);
	};

	onKeyDown (e: any) {
		const { expanded } = this.state;

		if (!expanded) {
			return;
		};

		e.preventDefault();
		e.stopPropagation();
		
		const k = e.key.toLowerCase();
		const items = this.getItems();
		const l = items.length;

		switch (k) {
			case Key.up:
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive();
				break;
				
			case Key.down:
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive();
				break;

			case Key.left:
				this.n = 0;
				this.panel--;
				if (this.panel < Panel.Left) {
					this.panel = Panel.Right;
				};
				if (!this.getItems().length) {
					this.panel = Panel.Right;
				};
				this.setActive();
				break;
				
			case Key.right:
				this.n = 0;
				this.panel++;
				if (this.panel > Panel.Right) {
					this.panel = Panel.Left;
				};
				if (!this.getItems().length) {
					this.panel = Panel.Left;
				};
				this.setActive();
				break;
				
			case Key.enter:
			case Key.space:
				const item = items[this.n];
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
		const { info, pagesIn, pagesOut } = this.state;

		let items = [];
		switch (this.panel) {
			case Panel.Left:
				items = pagesIn;
				break;
			
			case Panel.Center:
				items = [ info ];
				break;

			case Panel.Right:
				items = pagesOut;
				break;
		};
		return items;
	};

	setActive () {
		const items = this.getItems();
		const item = items[this.n];
		if (!item) {
			return;
		};

		const node = $(ReactDOM.findDOMNode(this));
		
		node.find('.active').removeClass('active');
		node.find(`#panel-${this.panel} #item-${item.id}`).addClass('active');
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
			this.setState({ 
				pageLeft: 0, 
				pageRight: 0,
				filter: Util.filterFix(this.ref.getValue()),
			});
		}, force ? 0 : 50);
	};

	loadSearch () {
		const { param } = this.props;
		const { data } = param;
		const { skipId } = data;

		this.setState({ loading: true });

		this.index = new FlexSearch('balance', {
			encode: 'extra',
    		tokenize: 'full',
			threshold: 1,
    		resolution: 3,
		});

		let pages: any[] = [];
		C.NavigationListPages((message: any) => {
			for (let page of message.pages) {
				if (skipId && (page.id == skipId)) {
					continue;
				};

				page = this.getPage(page);
				pages.push(page);

				this.index.add(page.id, [ page.details.name, page.snippet ].join(' '));
			};

			if (this.ref) {
				this.ref.focus();
			};
			this.setState({ pages: pages, loading: false });
		});
	};

	loadPage (id: string) {
		this.setState({ loading: true });
		this.setCrumbs(id);

		C.NavigationGetPageInfoWithLinks(id, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			this.n = 0;
			this.panel = 2;

			this.initSearch(id);
			this.setState({ 
				pageId: id,
				loading: false,
				expanded: true, 
				info: this.getPage(message.page.info),
				pagesIn: message.page.links.inbound.map((it: any) => { return this.getPage(it); }),
				pagesOut: message.page.links.outbound.map((it: any) => { return this.getPage(it); }),
			});
		});
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

		switch (type) {
			case I.NavigationType.Go:
				crumbs.cut(I.CrumbsType.Page, 0, () => {
					if (item.id == root) {
						history.push('/main/index');
					} else {
						DataUtil.pageOpen(e, item.id);
					};
				});
				break;

			case I.NavigationType.Move:
				C.BlockListMove(rootId, item.id, blockIds, '', I.BlockPosition.Bottom);
				break;

			case I.NavigationType.Create:
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
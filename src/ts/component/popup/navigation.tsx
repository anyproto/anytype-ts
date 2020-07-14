import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Smile, Icon, Button, Input, Cover, Loader } from 'ts/component';
import { I, C, Util, DataUtil, crumbs } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
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

enum Panel { Left, Right };

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
	
	constructor (props: any) {
		super (props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onConfirm = this.onConfirm.bind(this);
	};
	
	render () {
		const { pageId, expanded, filter, info, pagesIn, pagesOut, loading, pageLeft, pageRight, showIcon } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { type } = data;
		const { root, breadcrumbs } = blockStore;
		const details = blockStore.getDetails(breadcrumbs, pageId);
		const isRoot = pageId == root;
		const page = pageLeft;

		let n = 0;
		let confirm = '';
		let pages = this.state.pages;
		let iconSearch = null;
		let iconButton = '';

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
				confirm = 'Open as page';
				iconButton = 'expand';
				break;

			case I.NavigationType.Move:
				confirm = 'Move to page';
				break;

			case I.NavigationType.Create:
				confirm = 'Link to page';
				break;
		};

		const head = (
			<form id="head" className="head" onSubmit={this.onSubmit}>
				{iconSearch}
				<Input ref={(ref: any) => { this.ref = ref; }} value={details.name} placeHolder="Search for a page..." onKeyDown={this.onKeyDown} onKeyUp={(e: any) => { this.onKeyUp(e, false); }} />
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
			} else {
				icon = <Smile icon={iconEmoji} hash={iconImage} className="c48" size={24} />
			};
			
			return (
				<div className="selected">
					{icon}
					<div className="name">{name}</div>
					<div className="descr">{item.snippet}</div>
					{coverId && coverType ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
					<div className="buttons">
						<Button text={confirm} icon={iconButton} className="orange" onClick={(e: any) => { this.onConfirm(e, item); }} />
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
							<div className="items left">
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
							<div className="items center">
								{info ? <Selected {...info} /> : ''}
							</div>
							<div className="items right">
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
		};
	};
	
	componentDidUpdate () {
		const { expanded } = this.state;
		this.initSize(expanded);
	};
	
	componentWillUnmount () {
		this._isMounted = false;

		$(window).unbind('resize.navigation');
		window.clearTimeout(this.timeout);
	};
	
	initSize (expanded: boolean) {
		if (!this._isMounted) {
			return;
		};

		const win = $(window);
		const obj = $('#popupNavigation #innerWrap');
		
		expanded ? obj.addClass('expanded') : obj.removeClass('expanded');
		
		this.resize();
		win.unbind('resize.navigation').on('resize.navigation', () => { this.resize(); });

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
			const oh = wh - 70;
			const sh = oh - offset;

			sides.css({ height: sh });
			items.css({ height: sh });
			empty.css({ height: sh, lineHeight: sh + 'px' });

			obj.css({ marginLeft: -obj.width() / 2, marginTop: 0, top: 38, height: oh });
		});
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		this.onKeyUp(e, true);
	};

	onKeyDown (e: any) {
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
	
	onKeyUp (e: any, force: boolean) {
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
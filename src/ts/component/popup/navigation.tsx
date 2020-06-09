import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Smile, Icon, Button, Input, Cover, Loader } from 'ts/component';
import { I, C, Util, Decode, crumbs } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { DataUtil } from '../../lib';

interface Props extends I.Popup {
	history: any;
};

interface State {
	isOpen: boolean;
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

const HEIGHT = 80;
const PAGE = 10;

enum Panel { Left, Right };

@observer
class PopupNavigation extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		isOpen: false,
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
	
	constructor (props: any) {
		super (props);
		
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.onConfirm = this.onConfirm.bind(this);
		this.onCancel = this.onCancel.bind(this);
	};
	
	render () {
		const { expanded, filter, info, pagesIn, pagesOut, loading, isOpen, pageLeft, pageRight } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { type } = data;
		const { root } = blockStore;
		const isRoot = info && (info.id == root);
		const page = pageLeft;

		if (!isOpen) {
			return null;
		};

		let placeHolder = '';
		let confirm = '';
		let id = 0;
		let pages = this.state.pages;

		switch (type) {
			default:
				placeHolder = 'Search for a page...';
				confirm = 'Open';
				break;

			case I.NavigationType.Move:
				placeHolder = 'Move to...';
				confirm = 'Move';
				break;

			case I.NavigationType.Create:
				confirm = 'Link';
				break;
		};
		
		if (filter) {
			const ids = this.index.search(filter);
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
					<div className="line" />
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

		const ItemPath = (item: any) => {
			let isRoot = item.id == root;
			let icon = null;
			let name = '';

			if (item.isSearch) {
				name = 'Search for an object';
				icon = <Icon className="search" />
			} else
			if (isRoot) {
				name = item.details.name;
				icon = <Icon className="home" />;
			} else {
				name = item.details.name;
				icon = <Smile icon={item.details.iconEmoji} hash={item.details.iconImage} />;
			};

			return (
				<div className="item" onClick={(e: any) => { item.isSearch ? this.onSearch() : this.onClick(e, item); }}>
					{icon}
					<div className="name">{Util.shorten(name, 24)}</div>
					<Icon className="arrow" />
				</div>
			);
		};
		
		const Selected = (item: any) => {
			const { iconEmoji, iconImage, name, coverType, coverId, coverX, coverY, coverScale } = item.details;
			const isRoot = item.id == root;
			
			return (
				<div className="selected">
					{isRoot ? (
						<div className="smile c48">
							<Icon className="home big" />
						</div>
					) : (
						<Smile icon={iconEmoji} hash={iconImage} className="c48" size={24} />
					)}
					<div className="name">{name}</div>
					<div className="descr">{item.snippet}</div>
					{(coverType != I.CoverType.None) && coverId ? <Cover type={coverType} id={coverId} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
					<div className="buttons">
						<Button text={confirm} className="orange" onClick={(e: any) => { this.onConfirm(e, item); }} />
						<Button text="Cancel" className="grey" onClick={this.onCancel} />
					</div>
				</div>
			);
		};

		return (
			<div className={expanded ? 'expanded' : ''}>
				{loading ? <Loader /> : ''}
				{expanded ? (
					<React.Fragment>
						<div id="head" className="path">
							<ItemPath isSearch={true} />
							{info ? <ItemPath {...info} /> : ''}
						</div>

						<div key="sides" className="sides">
							<div className="items left">
								{!isRoot ? (
									<React.Fragment>
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
						<form id="head" className="head" onSubmit={this.onSubmit}>
							<Icon className="search" />
							<Input ref={(ref: any) => { this.ref = ref; }} placeHolder={placeHolder} onKeyUp={(e: any) => { this.onKeyUp(e, false); }} />
						</form>

						{!pages.length && !loading ? (
							<div id="empty "key="empty" className="empty">
								<div className="txt">
									<b>There is no pages named "{filter}"</b>
									Try creating a new one or search for something else.
								</div>
							</div>
						) : (
							<div key="items" className="items left">
								{pages.map((item: any, i: number) => {
									if (++id > (page + 1) * PAGE) {
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
		const { param, history } = this.props;
		const { data } = param;
		const expanded = (data.id ? true : false);

		this._isMounted = true;
		this.init(expanded);

		window.setTimeout(() => {
			this.setState({ expanded: expanded, isOpen: true });
			this.loadSearch();

			if (expanded) {
				this.loadPage(data.id);
			};
		}, 10);
	};
	
	componentDidUpdate () {
		const { expanded } = this.state;
		this.init(expanded);
	};
	
	componentWillUnmount () {
		this._isMounted = false;

		$(window).unbind('resize.tree');
		window.clearTimeout(this.timeout);
	};
	
	init (expanded: boolean) {
		if (!this._isMounted) {
			return;
		};

		const win = $(window);
		const obj = $('#popupNavigation');
		
		expanded ? obj.addClass('expanded') : obj.removeClass('expanded');
		
		this.resize();
		win.unbind('resize.tree').on('resize.tree', () => { this.resize(); });

		obj.find('.items.left').unbind('scroll.navigation').on('scroll.navigation', (e: any) => { this.onScroll(Panel.Left); });
		obj.find('.items.right').unbind('scroll.navigation').on('scroll.navigation', (e: any) => { this.onScroll(Panel.Right); });
	};

	onScroll (panel: Panel) {
		const node = $(ReactDOM.findDOMNode(this));
		const content = panel == Panel.Left ? node.find('.items.left') : node.find('.items.right');
		const stateKey = panel == Panel.Left ? 'pageLeft' : 'pageRight';
		const top = content.scrollTop();

		let page = this.state[stateKey];

		if (top >= page * PAGE * HEIGHT) {
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
			const obj = $('#popupNavigation');
			const head = obj.find('#head');
			const items = obj.find('.items');
			const sides = obj.find('.sides');
			const empty = obj.find('#empty');
			const offset = expanded ? 32 : 0;
			const height = win.height() - head.outerHeight() - 128;

			sides.css({ height: height });
			items.css({ height: height - offset });
			empty.css({ height: height, lineHeight: height + 'px' });
			obj.css({ marginLeft: -obj.width() / 2, marginTop: -obj.height() / 2 });
		});
	};
	
	onSubmit (e: any) {
		e.preventDefault();
		this.onKeyUp(e, true);
	};
	
	onKeyUp (e: any, force: boolean) {
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

		C.NavigationGetPageInfoWithLinks(id, (message: any) => {
			if (message.error.code) {
				this.setState({ loading: false });
				return;
			};

			this.setState({ 
				loading: false,
				expanded: true, 
				info: this.getPage(message.page.info),
				pagesIn: message.page.links.inbound.map((it: any) => { return this.getPage(it); }),
				pagesOut: message.page.links.outbound.map((it: any) => { return this.getPage(it); }),
			});
		});
	};
	
	onClick (e: any, item: I.PageInfo) {
		e.stopPropagation();

		const { expanded } = this.state;
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

		commonStore.popupClose(this.props.id);
	};

	onSearch () {
		this.setState({ expanded: false });
	};
	
	onCancel (e: any) {
		commonStore.popupClose(this.props.id);
	};

	getPage (page: any): I.PageInfo {
		let details = Decode.decodeStruct(page.details || {});
		details.name = String(details.name || Constant.default.name || '');

		return {
			id: page.id,
			snippet: page.snippet,
			details: details,
			text: [ details.name, page.snippet ].join(' '),
		};
	};
	
};

export default PopupNavigation;
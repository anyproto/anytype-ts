import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Smile, Icon, Button, Input, Cover, Loader } from 'ts/component';
import { I, C, Util, StructDecode, crumbs } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

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
};

const $ = require('jquery');
const raf = require('raf');
const FlexSearch = require('flexsearch');
const Constant = require('json/constant.json');

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
		const { expanded, filter, info, pagesIn, pagesOut, loading, isOpen } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { type } = data;

		if (!isOpen) {
			return null;
		};

		let placeHolder = '';
		let confirm = '';

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
		
		let pages = this.state.pages;
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

			return (
				<div id={'item-' + item.id} className="item">
					<div onClick={(e: any) => { this.onClick(e, item); }}>
						<Smile icon={iconEmoji} hash={iconImage} className="c48" size={24} />
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

		const ItemPath = (item: any) => {
			let icon = null;
			let name = '';

			if (item.isSearch) {
				name = 'Search';
				icon = <Icon className="search" />
			} else {
				name = item.details.name;
				icon = <Smile icon={item.details.iconEmoji} hash={item.details.iconImage} className="c24" size={20} />;
			};

			return (
				<div className="item" onClick={(e: any) => { item.isSearch ? this.onSearch() : this.onClick(e, item); }}>
					{icon}
					<div className="name">{Util.shorten(name, 16)}</div>
					<Icon className="arrow" />
				</div>
			);
		};
		
		const Selected = (item: any) => {
			const { iconEmoji, iconImage, name, coverType, coverId, coverX, coverY, coverScale } = item.details;
			
			return (
				<div className="selected">
					<Smile icon={iconEmoji} hash={iconImage} className="c48" size={24} />
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
								{!pagesIn.length ? (
									<ItemEmpty name="No links to this page" />
								) : (
									<React.Fragment>
										{pagesIn.map((item: any, i: number) => {
											return <Item key={i} {...item} />;
										})}
									</React.Fragment>
								)}
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
							<div key="items" className="items">
								{pages.map((item: any, i: number) => {
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
			this.setState({ filter: Util.filterFix(this.ref.getValue()) });
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
		const { expanded } = this.state;

		e.stopPropagation();
		expanded ? this.onConfirm(e, item) : this.loadPage(item.id);
	};

	onClickArrow (e: any, item: I.PageInfo) {
		const { expanded } = this.state;
		expanded ? this.loadPage(item.id) : this.onConfirm(e, item);
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
						history.push('/main/edit/' + item.id);
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
		let details = StructDecode.decodeStruct(page.details || {});
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
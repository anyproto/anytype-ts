import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Title, Smile, Icon, Button, Input, Cover } from 'ts/component';
import { I, C, Util, StructDecode } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Popup {};
interface State {
	expanded: boolean;
	filter: string;
	pages: I.PageInfo[];
	info: I.PageInfo;
	pagesIn: I.PageInfo[];
	pagesOut: I.PageInfo[];
};

const $ = require('jquery');
const FlexSearch = require('flexsearch');
const Constant = require('json/constant.json');

@observer
class PopupTree extends React.Component<Props, State> {
	
	state = {
		expanded: false,
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
		const { expanded, filter, info, pagesIn, pagesOut } = this.state;
		
		let pages = this.state.pages;
		if (filter) {
			const ids = this.index.search(filter);
			pages = pages.filter((it: I.PageInfo) => { return ids.indexOf(it.id) >= 0; });
		};

		const Item = (item: any) => {
			let { iconEmoji, name } = item.details;

			return (
				<div id={'item-' + item.id} className="item" onClick={(e: any) => { this.onClick(e, item); }}>
					<Smile icon={iconEmoji} className="c48" size={24} />
					<div className="info">
						<div className="name">{name}</div>
						<div className="descr">{item.snippet}</div>
					</div>
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
				icon = <Smile icon={item.details.iconEmoji} className="c24" size={20} />;
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
			const { iconEmoji, name, coverType, coverId, coverX, coverY, coverScale } = item.details;
			
			return (
				<div className="selected">
					<Smile icon={iconEmoji} className="c48" size={24} />
					<div className="name">{name}</div>
					<div className="descr">{item.snippet}</div>
					{(coverType != I.CoverType.None) && coverId ? <Cover type={coverType} image={coverId} className={coverId} x={coverX} y={coverY} scale={coverScale} withScale={true} /> : ''}
					<div className="buttons">
						<Button text="Open" className="orange" onClick={this.onConfirm} />
						<Button text="Cancel" className="grey" onClick={this.onCancel} />
					</div>
				</div>
			);
		};
		
		return (
			<div className={expanded ? 'expanded' : ''}>
				{expanded ? (
					<React.Fragment>
						<div id="head" className="path">
							<ItemPath isSearch={true} />
							<ItemPath {...info} />
						</div>

						<div key="sides" className="sides">
							<div className="items left">
								{pagesIn.map((item: any, i: number) => {
									return <Item key={i} {...item} />;
								})}
							</div>
							<div className="items center">
								<Selected {...info} />
							</div>
							<div className="items right">
								{pagesOut.map((item: any, i: number) => {
									return <Item key={i} {...item} />;
								})}
							</div>
						</div>
					</React.Fragment>
				) : (
					<React.Fragment>
						<form id="head" className="head" onSubmit={this.onSubmit}>
							<Icon className="search" />
							<Input ref={(ref: any) => { this.ref = ref; }} placeHolder="Type to search..." onKeyUp={(e: any) => { this.onKeyUp(e, false); }} />
						</form>

						{!pages.length ? (
							<div key="empty" className="empty">
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
		this.init();
		this.ref.focus();
		this.index = new FlexSearch('balance', {});

		let pages: any[] = [];

		C.NavigationListPages((message: any) => {
			for (let page of message.pages) {
				page = this.getPage(page);
				pages.push(page);

				this.index.add(page.id, [ page.details.name, page.snippet ].join(' '));
			};

			this.setState({ pages: pages });
		});
	};
	
	componentDidUpdate () {
		this.init();
	};
	
	componentWillUnmount () {
		$(window).unbind('resize.tree');
		window.clearTimeout(this.timeout);
	};
	
	init () {
		const { expanded } = this.state;
		const win = $(window);
		const obj = $('#popupTree');
		
		expanded ? obj.addClass('expanded') : obj.removeClass('expanded');
		
		this.resize();
		win.unbind('resize.tree').on('resize.tree', () => { this.resize(); });
	};
	
	resize () {
		const { expanded } = this.state;
		const win = $(window);
		const obj = $('#popupTree');
		const head = obj.find('#head');
		const items = obj.find('.items');
		const sides = obj.find('.sides');
		const empty = obj.find('.empty');
		const offset = expanded ? 32 : 0;
		const height = win.height() - head.outerHeight() - 128;
		
		sides.css({ height: height });
		items.css({ height: height - offset });
		empty.css({ height: height, lineHeight: height + 'px' });
		obj.css({ marginLeft: -obj.width() / 2 });
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
	
	onClick (e: any, item: any) {
		C.NavigationGetPageInfoWithLinks(item.id, (message: any) => {
			this.setState({ 
				expanded: true, 
				info: this.getPage(message.page.info),
				pagesIn: message.page.links.inbound.map((it: any) => { return this.getPage(it); }),
				pagesOut: message.page.links.outbound.map((it: any) => { return this.getPage(it); }),
			});
		});
	};

	onSearch () {
		this.setState({ expanded: false });
	};
	
	onConfirm (e: any) {
	};
	
	onCancel (e: any) {
	};

	getPage (page: any): I.PageInfo {
		let details = StructDecode.decodeStruct(page.details);
		details.name = String(details.name || Constant.default.name || '');

		return {
			id: page.id,
			snippet: page.snippet,
			details: details,
		};
	};
	
};

export default PopupTree;
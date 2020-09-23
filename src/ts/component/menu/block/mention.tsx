import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MenuItemVertical } from 'ts/component';
import { I, C, Key, keyboard, Util, SmileUtil, DataUtil, Mark } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

interface State {
	pages: I.PageInfo[];
	loading: boolean;
	page: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const FlexSearch = require('flexsearch');

const HEIGHT = 28;
const PAGE = 12;

@observer
class MenuBlockMention extends React.Component<Props, State> {

	_isMounted: boolean = false;	
	n: number = 0;
	filter: string = '';
	index: any = null;

	state = {
		pages: [],
		loading: false,
		page: 0,
	};
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { page } = this.state;
		const sections = this.getSections();

		let id = 0;

		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
						if (++id > (page + 1) * PAGE) {
							return null;
						};

						return <MenuItemVertical key={i} {...action} onMouseEnter={(e: any) => { this.onOver(e, action); }} onClick={(e: any) => { this.onClick(e, action); }} />;
					})}
				</div>
			</div>
		);

		return (
			<div className="items">
				{!sections.length ? <div className="item empty">No items match filter</div> : ''}
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.loadSearch();
	};

	componentDidUpdate () {
		const { filter } = commonStore;
		const items = this.getItems();

		if (this.filter != filter.text) {
			this.filter = filter.text;
			this.setState({ page: 0 });
		};

		this.setActive(items[this.n]);
		this.props.position();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
		node.find('.items').unbind('scroll.menu').on('scroll.menu', (e: any) => { this.onScroll(); });
	};
	
	unbind () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		win.unbind('keydown.menu');
		node.find('.items').unbind('scroll.menu');
	};

	onScroll () {
		const { id } = this.props;
		const { page } = this.state;
		const menu = $('#' + Util.toCamelCase('menu-' + id));
		const content = menu.find('.content');
		const top = content.scrollTop();

		if (top >= page * PAGE * HEIGHT) {
			this.setState({ page: page + 1 });
		};
	};

	getSections () {
		const { root } = blockStore;
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const pages = this.filterPages();

		let pageData = [];

		pageData.unshift({
			id: 'create', 
			name: 'Create new page', 
			icon: '',
			hash: '',
			withSmile: true,
			skipFilter: true,
		});

		for (let page of pages) {
			if ([ root, rootId ].indexOf(page.id) >= 0) {
				continue;
			};
			
			pageData.push({
				id: page.id, 
				name: page.details.name, 
				icon: page.details.iconEmoji,
				hash: page.details.iconImage,
				withSmile: true,
			});
		};

		let sections = [
			{ id: 'page', name: 'Mention a page', children: pageData },
		];

		sections = DataUtil.menuSectionsMap(sections);
		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		if (item) {
			this.n = items.findIndex((it: any) => { return it.id == item.id; });
		};
		this.onScroll();
		window.setTimeout(() => {
			this.props.setActiveItem(items[this.n], scroll);
		});
	};

	loadSearch () {
		const pages: I.PageInfo[] = [];

		this.setState({ loading: true });

		this.index = new FlexSearch('balance', {
			encode: 'extra',
    		tokenize: 'full',
			threshold: 1,
    		resolution: 3,
		});

		C.NavigationListPages((message: any) => {
			if (message.error.code) {
				return;
			};

			for (let page of message.pages) {
				page = this.getPage(page);
				if (page.details.isArchived) {
					continue;
				};

				pages.push(page);
				this.index.add(page.id, [ page.details.name, page.snippet ].join(' '));
			};

			this.setState({ pages: pages, loading: false });
		});
	};

	filterPages (): I.PageInfo[] {
		const { pages } = this.state;
		const { filter } = commonStore;
		
		if (!filter.text) {
			return pages;
		};

		const ids = this.index ? this.index.search(filter.text) : [];
		
		let ret = [];
		if (ids.length) {
			ret = pages.filter((it: I.PageInfo) => { return ids.indexOf(it.id) >= 0; });
		} else {
			const reg = new RegExp(filter.text.split(' ').join('[^\s]*|') + '[^\s]*', 'i');
			ret = pages.filter((it: I.PageInfo) => { return it.text.match(reg); });
		};
		return ret;
	};

	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();

		const k = e.key.toLowerCase();
		keyboard.disableMouse(true);
		
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				e.preventDefault();
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				this.setActive(null, true);
				break;
				
			case Key.down:
				e.preventDefault();
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				this.setActive(null, true);
				break;
				
			case Key.tab:
			case Key.enter:
				e.preventDefault();
				if (item) {
					this.onClick(e, item);
				};
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		const { param } = this.props;
		const { filter } = commonStore;
		const { data } = param;
		const { rootId, blockId, onChange } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};

		const cb = (id: string, name: string) => {
			const { content } = block;
		
			let { marks } = content;
			let from = filter.from;
			let to = from + name.length + 1;
	
			marks = Util.objectCopy(marks);
			marks = Mark.adjust(marks, from, name.length + 1);
			marks = Mark.toggle(marks, { 
				type: I.MarkType.Mention, 
				param: id, 
				range: { from: from, to: from + name.length },
			});
	
			onChange(name + ' ', marks, from, to);
		};

		if (item.key == 'create') {
			C.PageCreate({ iconEmoji: SmileUtil.random(), name: filter.text }, (message: any) => {
				if (message.error.code) {
					return;
				};

				cb(message.pageId, (filter.text || Constant.default.name));
			});
		} else {
			cb(item.key, item.name);
		};

		this.props.close();
	};

	getPage (page: any): I.PageInfo {
		page.details.name = String(page.details.name || Constant.default.name || '');

		return {
			...page,
			text: [ page.details.name, page.snippet ].join(' '),
		};
	};
	
};

export default MenuBlockMention;
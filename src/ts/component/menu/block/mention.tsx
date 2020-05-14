import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
import { I, C, Key, keyboard, StructDecode, DataUtil, Mark } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {};

interface State {
	pages: I.PageInfo[];
	loading: boolean;
};

const $ = require('jquery');
const FlexSearch = require('flexsearch');
const Constant = require('json/constant.json');

@observer
class MenuBlockMention extends React.Component<Props, State> {

	_isMounted: boolean = false;	
	n: number = 0;

	state = {
		pages: [],
		loading: false,
	};
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const sections = this.getSections();
		const { filter } = commonStore;

		const Section = (item: any) => (
			<div className="section">
				{item.name ? <div className="name">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => {
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
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getSections () {
		const { pages } = this.state;
		const { filter } = commonStore;

		let id = 1;
		let pageData = [];

		for (let page of pages) {
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

		if (filter && filter.text) {
			sections = DataUtil.menuSectionsFilter(sections, filter.text);
		};

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
		this.props.setActiveItem(items[this.n], scroll);
	};

	loadSearch () {
		this.setState({ loading: true });
		let pages: any[] = [];

		C.NavigationListPages((message: any) => {
			pages = message.pages.map((it: any) => { return this.getPage(it); });
			this.setState({ pages: pages, loading: false });
		});
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
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();

		const k = e.which;
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
				
			case Key.enter:
				e.preventDefault();
				if (item) {
					this.onClick(e, item);
				};
				break;
				
			case Key.escape:
				commonStore.menuClose(this.props.id);
				break;
		};
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {

		console.log(item);

		const { param } = this.props;
		const { filter } = commonStore;
		const { data } = param;
		const { rootId, blockId, onChange } = data;
		const block = blockStore.getLeaf(rootId, blockId);

		if (!block) {
			return;
		};

		const { content } = block;
		content.marks = Mark.toggle(content.marks, { 
			type: I.MarkType.Mention, 
			param: item.key, 
			range: { from: filter.from, to: filter.from + item.name.length },
		});

		onChange(item.name + ' ', content.marks, { from: filter.from, to: filter.from + filter.text.length + 1 });
		commonStore.menuClose(this.props.id);
	};
	
};

export default MenuBlockMention;
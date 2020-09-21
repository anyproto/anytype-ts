import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MenuItemVertical } from 'ts/component';
import { I, C, Key, keyboard, Util, SmileUtil, DataUtil, Mark } from 'ts/lib';
import { commonStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

interface State {
	pages: I.PageInfo[];
	loading: boolean;
	n: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const FlexSearch = require('flexsearch');
const HEIGHT = 28;

@observer
class MenuBlockMention extends React.Component<Props, State> {

	state = {
		pages: [],
		loading: false,
		n: 0,
	};

	_isMounted: boolean = false;	
	filter: string = '';
	index: any = null;
	cache: any = null;

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { n } = this.state;
		const items = this.getItems();

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item = items[param.index];
			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<div style={param.style}>
						{item.isSection ? (
							<div className="section">
								{item.name ? <div className="name">{item.name}</div> : ''}
							</div>
						) : (
							<MenuItemVertical {...item} onMouseEnter={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onClick(e, item); }} />
						)}
					</div>
				</CellMeasurer>
			);
		};

		return (
			<div className="items">
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
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.loadSearch();
	};

	componentDidUpdate () {
		const { filter } = commonStore;
		const { n } = this.state;
		const items = this.getItems();

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return items[i].id; },
		});

		if (this.filter != filter.text) {
			this.filter = filter.text;
			this.setState({ n: 0 });
		};

		this.setActive(items[n]);
		this.props.position();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getSections () {
		const { root } = blockStore;
		const { param } = this.props;
		const { data } = param;
		const { rootId } = data;
		const pages = this.filterPages();
		const list: any[] = [
			{ id: '', name: 'Mention a page', isSection: true },
			{ id: 'create', name: 'Create new page', icon: '', hash: '', withSmile: true, skipFilter: true }
		];

		for (let page of pages) {
			if ([ root, rootId ].indexOf(page.id) >= 0) {
				continue;
			};
			
			list.push({
				id: page.id, 
				name: page.details.name, 
				icon: page.details.iconEmoji,
				hash: page.details.iconImage,
				withSmile: true,
			});
		};

		let sections = [
			{ id: 'page', children: list },
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
		const { n } = this.state;
		this.props.setActiveItem((item ? item : items[n]), scroll);
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

		let { n } = this.state;
		const k = e.key.toLowerCase();
		keyboard.disableMouse(true);
		
		const items = this.getItems();
		const l = items.length;
		const item = items[n];

		switch (k) {
			case Key.up:
				e.preventDefault();
				n--;
				if (n < 0) {
					n = l - 1;
				};
				this.setState({ n: n });
				this.setActive(null, true);
				break;
				
			case Key.down:
				e.preventDefault();
				n++;
				if (n > l - 1) {
					n = 0;
				};
				this.setState({ n: n });
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

		if (item.key == 'create') {
			DataUtil.pageCreate(e, rootId, blockId, { iconEmoji: SmileUtil.random(), name: filter.text }, I.BlockPosition.Bottom);
		} else {
			const { content } = block;
		
			let { marks } = content;
			let from = filter.from;
			let to = from + item.name.length + 1;
	
			marks = Util.objectCopy(marks);
			marks = Mark.adjust(marks, from, item.name.length + 1);
			marks = Mark.toggle(marks, { 
				type: I.MarkType.Mention, 
				param: item.key, 
				range: { from: from, to: from + item.name.length },
			});
	
			onChange(item.name + ' ', marks, from, to);
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
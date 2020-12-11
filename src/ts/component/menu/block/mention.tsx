import * as React from 'react';
import { IconObject } from 'ts/component';
import { I, C, Key, keyboard, Util, SmileUtil, DataUtil, Mark } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
	n: number;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT_SECTION = 42;
const HEIGHT_ITEM = 28;
const LIMIT = 10;

@observer
class MenuBlockMention extends React.Component<Props, State> {

	state = {
		loading: false,
		n: 0,
	};

	_isMounted: boolean = false;	
	filter: string = '';
	index: any = null;
	cache: any = null;
	items: any = [];

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { n } = this.state;
		const items = this.getItems(true);
		const { filter } = commonStore;
		const { text } = filter;

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
							<div id={'item-' + item.id} className="item" onMouseEnter={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
								<IconObject object={item} />
								<div className="name">{item.name}</div>
							</div>
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
									rowHeight={({ index }) => {
										const item = items[index];
										let height = HEIGHT_ITEM;
										if (item.isSection) {
											height = HEIGHT_SECTION;
											if ((index == 0) || index == (items.length - 1)) {
												height -= 8;
											};
										};
										return height;
									}}
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
		this.resize();
		this.load();
	};

	componentDidUpdate () {
		const { filter } = commonStore;
		const { n } = this.state;
		const items = this.getItems(false);

		if (this.filter != filter.text) {
			this.load();
			this.filter = filter.text;
			this.setState({ n: 0 });
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
		this.setActive(items[n]);
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
		let obj: any = {};
		for (let item of this.items) {
			let ot = dbStore.getObjectType(item.type);
			if (!ot) {
				continue;
			};

			let type = DataUtil.schemaField(item.type) || 'page';
			let section = obj[type];

			if (!section) {
				 obj[type] = section = { 
					id: type, 
					children: [ 
						{ id: '', name: ot.name, isSection: true },
					] 
				};
				if (type == 'page') {	
					obj[type].children.push({ id: 'create', name: 'Create new page', object: {}, skipFilter: true });
				};
			};

			section.children.push({ ...item, object: item });
		};

		const sections = DataUtil.menuSectionsMap(Object.values(obj));
		sections.sort((c1: any, c2: any) => {
			if (c1.name > c2.name) return 1;
			if (c1.name < c2.name) return -1;
			return 0;
		});
		return sections;
	};

	getItems (withSections: boolean) {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};

		if (!withSections) {
			items = items.filter((it: any) => { return !it.isSection; });
		};

		return items;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems(false);
		const { n } = this.state;
		this.props.setActiveItem((item ? item : items[n]), scroll);
	};

	load (callBack?: (message: any) => void) {
		const { filter } = commonStore;
		const filters = [];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		this.setState({ loading: true });

		C.ObjectSearch(filters, sorts, filter.text, 0, 1000000, (message: any) => {
			if (callBack) {
				callBack(message);
			};

			this.items = this.items.concat(message.records.map((it: any) => {
				it.name = String(it.name || Constant.default.name);
				return it;
			}));

			this.setState({ loading: false });
		});
	};

	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();
		keyboard.disableMouse(true);

		let { n } = this.state;
		
		const k = e.key.toLowerCase();
		const items = this.getItems(false);
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

		if (!item || item.isSection) {
			this.props.close();
			return;
		};

		const { param } = this.props;
		const { filter } = commonStore;
		const { data } = param;
		const { onChange } = data;

		const cb = (id: string, name: string) => {
			let from = filter.from;
			let to = from + name.length + 1;
			let marks = Util.objectCopy(data.marks || []);

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

	resize () {
		const { id, position } = this.props;
		const items = this.getItems(true);
		const obj = $('#' + Util.toCamelCase('menu-' + id) + ' .content');
		const height = Math.max(HEIGHT_ITEM * 3, Math.min(HEIGHT_ITEM * LIMIT, items.length * HEIGHT_ITEM + 16));

		obj.css({ height: height });
		position();
	};
	
};

export default MenuBlockMention;
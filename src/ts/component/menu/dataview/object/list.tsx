import * as React from 'react';
import { Icon, Smile } from 'ts/component';
import { I, C, DataUtil, Util, Key, keyboard } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

interface State {
	n: number;
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT_SECTION = 42;
const HEIGHT_ITEM = 28;
const LIMIT = 40;

@observer
class MenuDataviewObjectList extends React.Component<Props, State> {

	state = {
		loading: false,
		n: 0,
	};

	_isMounted: boolean = false;	
	filter: string = '';
	cache: any = null;
	offset: number = 0;
	items: any[] = [];

	constructor (props: any) {
		super(props);
		
		this.loadMoreRows = this.loadMoreRows.bind(this);
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { n } = this.state;
		const items = this.getItems(true);

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item = items[param.index];
			if (!item) {
				return null;
			};

			const type = DataUtil.schemaField(item.type && item.type.length ? item.type[0] : '');

			let icon = null;
			let cn = [];

			switch (type) {
				default:
					icon = <Smile {...item} />;
					break;

				case 'image':
					icon = <img src={commonStore.imageUrl(item.id, 20)} className="preview" />;
					break;

				case 'file':
					icon = <Icon className={[ 'file-type', Util.fileIcon(item) ].join(' ')} />;
					break;
			};

			if (item.isSection) {
				cn.push('section');
				if (param.index == 0) {
					cn.push('first');
				};
				if (param.index == items.length - 1) {
					cn.push('last');
				};
			};

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
							<div className={cn.join(' ')}>
								{item.name ? <div className="name">{item.name}</div> : ''}
							</div>
						) : (
							<div id={'item-' + item.id} className="item" onMouseEnter={(e: any) => { this.onOver(e, item); }} onClick={(e: any) => { this.onClick(e, item); }}>
								{icon}
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
					isRowLoaded={() => { return true; }}
					threshold={LIMIT}
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
									overscanRowCount={LIMIT}
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
		const { n } = this.state;
		const items = this.getItems(false);

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
		const items = this.filterItems();
		const list: any[] = [
			{ id: '', name: 'Find and object', isSection: true },
		];

		let obj: any = {};

		for (let item of items) {
			let url = item.type && item.type.length ? item.type[0] : '';
			let ot = dbStore.getObjectType(url);
			if (!ot) {
				continue;
			};

			let type = DataUtil.schemaField(url) || 'page';
			let section = obj[type];

			if (!section) {
				 obj[type] = section = { 
					id: type, 
					children: [ 
						{ id: '', name: ot.name, isSection: true },
					] 
				};
			};

			section.children.push({
				...item,
				icon: item.iconEmoji,
				hash: item.iconImage,
				withSmile: true,
			});
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
		const { param } = this.props;
		const { data } = param;
		const { types, filter } = data;

		this.setState({ loading: true });

		const filters = [
			//{ relationKey: 'type', operator: I.FilterOperator.And, condition: I.FilterCondition.In, value: types },
		];

		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		C.ObjectSearch(filters, sorts, this.offset, 1000000, (message: any) => {
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

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += LIMIT;
			this.load(resolve);
		});
	};

	filterItems (): any[] {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		
		if (!filter) {
			return this.items;
		};

		const reg = new RegExp(filter.split(' ').join('[^\s]*|') + '[^\s]*', 'i');
		return this.items.filter((it: any) => { return it.name.match(reg); });
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
		const { data } = param;
		const { onChange } = data;

		let value = Util.objectCopy(data.value || []);
		value.push(item.key);
		value = Util.arrayUnique(value);

		this.props.param.data.value = value;
		onChange(value);

		this.props.close();
	};

	resize () {
		const { id, position } = this.props;
		const items = this.getItems(true);
		const obj = $('#' + Util.toCamelCase('menu-' + id) + ' .content');
		const height = Math.max(40, Math.min(240, items.length * 28 + 16));

		obj.css({ height: height });
		position();
	};

};

export default MenuDataviewObjectList;
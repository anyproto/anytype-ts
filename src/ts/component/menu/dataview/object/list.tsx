import * as React from 'react';
import { Icon, Smile } from 'ts/component';
import { I, C, DataUtil, Util, Key, keyboard } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

interface State {
	items: any[];
	n: number;
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;

@observer
class MenuDataviewObjectList extends React.Component<Props, State> {

	state = {
		items: [],
		loading: false,
		n: 0,
	};

	_isMounted: boolean = false;	
	filter: string = '';
	cache: any = null;

	constructor (props: any) {
		super(props);
		
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
			const type = DataUtil.schemaField(item.type && item.type.length ? item.type[0] : '');

			let icon = null;
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
		this.resize();
		this.load();
	};

	componentDidUpdate () {
		const { n } = this.state;
		const items = this.getItems(false);

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
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

		for (let item of items) {
			list.push({
				...item,
				icon: item.iconEmoji,
				hash: item.iconImage,
				withSmile: true,
			});
		};

		let sections = [
			{ id: 'page', children: list },
		];

		sections = DataUtil.menuSectionsMap(sections);
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

	load () {
		this.setState({ loading: true });

		const filters = [
			//{ relationKey: 'type', operator: I.FilterOperator.And, condition: I.FilterCondition.In, value: types },
		];

		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		C.ObjectSearch(filters, sorts, (message: any) => {
			this.setState({ 
				items: message.records.map((it: any) => {
					it.name = String(it.name || Constant.default.name);
					return it;
				}),
			});
		});
	};

	filterItems (): any[] {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const { items } = this.state;
		
		if (!filter) {
			return items;
		};

		const reg = new RegExp(filter.text.split(' ').join('[^\s]*|') + '[^\s]*', 'i');
		return items.filter((it: any) => { return it.name.match(reg); });
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

	/*
load () {
		const { param } = this.props;
		const { data } = param;
		const { types } = data;

		const filters = [
			//{ relationKey: 'type', operator: I.FilterOperator.And, condition: I.FilterCondition.In, value: types },
		];

		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		C.ObjectSearch(filters, sorts, (message: any) => {
			this.setState({ 
				items: message.records.map((it: any) => {
					it.name = String(it.name || Constant.default.name);
					return it;
				}),
			});
		});
	};
	*/
	
};

export default MenuDataviewObjectList;
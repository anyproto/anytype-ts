import * as React from 'react';
import { MenuItemVertical, Loader, Filter, ObjectName } from 'ts/component';
import { I, C, Util, keyboard, DataUtil, analytics } from 'ts/lib';
import { commonStore, dbStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT_SECTION = 28;
const HEIGHT_ITEM = 56;
const LIMIT_HEIGHT = 6;

const MenuBlockLink = observer(class MenuBlockLink extends React.Component<Props, State> {

	state = {
		loading: false,
	};

	_isMounted: boolean = false;	
	filter: string = '';
	index: any = null;
	cache: any = {};
	items: any = [];
	n: number = -1;
	top: number = 0;
	offset: number = 0;
	refList: any = null;
	refFilter: any = null;

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.onFilterClear = this.onFilterClear.bind(this);
		this.onScroll = this.onScroll.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems(true);

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const type: any = dbStore.getObjectType(item.type);
			const cn = [ 'isBig' ];

			let object = { ...item, id: item.itemId };
			if ([ 'add', 'link' ].indexOf(item.itemId) >= 0) {
				cn.push(item.itemId);
				object = null;
			};

			if (item.isHidden) {
				cn.push('isHidden');
			};

			let content = null;

			if (item.isSection) {
				content = <div className={[ 'sectionName', (param.index == 0 ? 'first' : '') ].join(' ')} style={param.style}>{item.name}</div>;
			} else {
				content = (
					<MenuItemVertical 
						id={item.id}
						object={object}
						icon={item.icon}
						name={<ObjectName object={item} />}
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }}
						withDescription={true}
						description={type ? type.name : undefined}
						style={param.style}
						iconSize={40}
						forceLetter={true}
						className={cn.join(' ')}
					/>
				);
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
					{content}
				</CellMeasurer>
			);
		};

		return (
			<div className="wrap">
				<Filter 
					ref={(ref: any) => { this.refFilter = ref; }} 
					placeholder="Paste link or search objects" 
					value={filter}
					onChange={this.onFilterChange}
					onClear={this.onFilterClear}
				/>

				<div className="items">
					{loading ? <Loader /> : (
						<InfiniteLoader
							rowCount={items.length}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!this.items[index]}
							threshold={LIMIT_HEIGHT}
						>
							{({ onRowsRendered, registerChild }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={(ref: any) => { this.refList = ref; }}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={({ index }) => this.getRowHeight(items[index])}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={10}
											onScroll={this.onScroll}
										/>
									)}
								</AutoSizer>
							)}
						</InfiniteLoader>
					)}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.load(true);
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems(false);

		if (this.filter != filter) {
			this.filter = filter;
			this.top = 0;
			this.n = -1;
			this.offset = 0;
			this.load(true);
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		if (this.refList && this.top) {
			this.refList.scrollToPosition(this.top);
		};

		this.resize();
		this.props.setActive();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	onFilterChange (e: any) {
		menuStore.updateData(this.props.id, { filter: this.refFilter.getValue() });
	};

	onFilterClear () {
		const { param } = this.props;
		const { data } = param;
		const { type, onChange } = data;

		onChange(type, '');
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const reg = new RegExp(Util.filterFix(filter), 'gi');

		let text = 'Create new object';
		let items = [].concat(this.items);

		if (filter) {
			text = `Create object “${filter}”`;
			items = items.filter((it: any) => {
				let ret = false;
				if (it.name && it.name.match(reg)) {
					ret = true;
				} else 
				if (it.description && it.description.match(reg)) {
					ret = true;
				};
				return ret;
			});
		};

		items.unshift({ id: 'add', name: text, icon: 'plus' });
		
		let sections: any[] = [
			{ id: I.MarkType.Object, name: 'Objects', children: items }
		];

		if (filter) {
			sections.unshift({ 
				id: I.MarkType.Link, name: 'Web sites',
				children: [
					{ id: 'link', name: filter, icon: 'link' }
				] 
			});
		};

		sections = DataUtil.menuSectionsMap(sections);
		return sections;
	};

	getItems (withSections: boolean) {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			if (withSections) {
				items.push({ id: section.id, name: section.name, isSection: true });
			};
			items = items.concat(section.children);
		};
		return items;
	};
	
	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menu;
			this.load(false, resolve);
		});
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { skipIds, filter } = data;

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
		];
		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
		];

		if (skipIds && skipIds.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};
		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (clear) {
			this.setState({ loading: true });
		};

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter.replace(/\\/g, ''), this.offset, Constant.limit.menu, (message: any) => {
			if (callBack) {
				callBack(null);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records);

			if (clear) {
				this.setState({ loading: false });
			} else {
				this.forceUpdate();
			};
		});
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			this.props.close();
			return;
		};

		const { param, close } = this.props;
		const { data } = param;
		const { filter, onChange } = data;

		if (item.itemId == 'link') {
			onChange(I.MarkType.Link, filter);
		} else
		if (item.itemId == 'add') {
			const type: any = dbStore.getObjectType(commonStore.type) || {};

			DataUtil.pageCreate('', '', { name: filter }, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.SelectType ], (message: any) => {
				if (message.error.code) {
					return;
				};

				onChange(I.MarkType.Object, message.targetId);

				analytics.event('CreateObject', {
					route: 'Link',
					objectType: type.id,
					layout: type.layout,
					template: '',
				});
			});
		} else {
			onChange(I.MarkType.Object, item.itemId);
		};

		close();
	};

	onScroll ({ clientHeight, scrollHeight, scrollTop }) {
		if (scrollTop) {
			this.top = scrollTop;
		};
	};

	getRowHeight (item: any) {
		return item.isSection ? HEIGHT_SECTION : HEIGHT_ITEM;
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems(true);
		const obj = $(`#${getId()} .content`);
		const offset = 6;
		const height = Math.max(HEIGHT_ITEM * 3 + offset, Math.min(HEIGHT_ITEM * LIMIT_HEIGHT, items.length * HEIGHT_ITEM + offset));

		obj.css({ height: height });
		position();
	};
	
});

export default MenuBlockLink;
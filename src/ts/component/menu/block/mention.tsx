import * as React from 'react';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { MenuItemVertical, Loader, ObjectName } from 'Component';
import { I, keyboard, Util, DataUtil, ObjectUtil, MenuUtil, Mark, analytics } from 'Lib';
import { commonStore, dbStore } from 'Store';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT_HEIGHT = 10;

const MenuBlockMention = observer(class MenuBlockMention extends React.Component<I.Menu, State> {

	state = {
		loading: false,
	};

	_isMounted = false;	
	filter = '';
	index: any = null;
	cache: any = {};
	items: any = [];
	n = -1;
	offset = 0;
	refList: any = null;

	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const filter = this.getFilter();
		const items = this.getItems();

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const type = dbStore.getType(item.type);
			const cn = [];

			let content = null;
			if (item.isDiv) {
				content = (
					<div className="separator" style={param.style}>
						<div className="inner" />
					</div>
				);
			} else {
				if (item.id == 'add') {
					cn.push('add');
				};
				if (item.isHidden) {
					cn.push('isHidden');
				};

				content = (
					<MenuItemVertical 
						id={item.id}
						object={item.id == 'add' ? undefined : item}
						icon={item.icon}
						name={<ObjectName object={item} />}
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }}
						caption={type ? type.name : undefined}
						style={param.style}
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
				>
					{content}
				</CellMeasurer>
			);
		};

		return (
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
										ref={ref => { this.refList = ref; }}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={({ index }) => this.getRowHeight(items[index])}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
										scrollToAlignment="center"
									/>
								)}
							</AutoSizer>
						)}
					</InfiniteLoader>
				)}
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
		const items = this.getItems();
		const filter = this.getFilter();

		if (this.filter != filter) {
			this.filter = filter;
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
		$(window).off('keydown.menu');
	};

	getFilter () {
		return String(commonStore.filter.text || '').replace(/^@/, '');
	};

	getSections () {
		const filter = this.getFilter().replace(/\\/g, '');
		const sections: any[] = [];

		if (this.items.length) {
			sections.push({ id: I.MarkType.Object, name: 'Objects', children: this.items.concat({ isDiv: true }) });
		};

		if (filter) {
			sections.push({ 
				children: [
					{ id: 'add', icon: 'plus', name: `Create object "${filter}"` }
				]
			});
		};

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

	load (clear: boolean, callBack?: (value: any) => void) {
		const { param } = this.props;
		const { data } = param;
		const { skipIds } = data;
		const filter = this.getFilter();
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: DataUtil.getSystemTypes(), },
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
		];

		if (skipIds && skipIds.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			this.setState({ loading: true });
		};

		DataUtil.search({
			filters,
			sorts,
			fullText: filter,
			offset: this.offset,
			limit: Constant.limit.menuRecords,
		}, (message: any) => {
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

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menuRecords;
			this.load(false, resolve);
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
		const { onChange } = data;
		const { from } = commonStore.filter;

		const cb = (id: string, name: string) => {
			name = String(name || DataUtil.defaultName('page'));
			name = Util.shorten(name, 30);

			const to = from + name.length;

			let marks = Util.objectCopy(data.marks || []);
			marks = Mark.adjust(marks, from, name.length);
			marks = Mark.toggle(marks, { 
				type: I.MarkType.Mention, 
				param: id, 
				range: { from, to },
			});

			onChange(name + ' ', marks, from, to + 1);
		};

		if (item.id == 'add') {
			const type = dbStore.getType(commonStore.type);
			const name = this.getFilter();

			ObjectUtil.create('', '', { name }, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.SelectType ], (message: any) => {
				if (message.error.code) {
					return;
				};

				cb(message.targetId, name);

				analytics.event('CreateObject', {
					route: 'Mention',
					objectType: type.id,
					layout: type.layout,
					template: '',
				});
			});
		} else {
			cb(item.id, item.name);
		};

		close();
	};

	getRowHeight (item: any) {
		let h = HEIGHT_ITEM;
		if (item.isDiv) h = HEIGHT_DIV;
		return h;
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 4;
		const height = Math.max(44, Math.min(HEIGHT_ITEM * LIMIT_HEIGHT, items.length * HEIGHT_ITEM + offset));

		obj.css({ height });
		position();
	};
	
});

export default MenuBlockMention;
import * as React from 'react';
import { MenuItemVertical, Loader, ObjectName } from 'ts/component';
import { I, C, keyboard, Util, DataUtil, Mark, analytics } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
}

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;

const LIMIT_LOAD = 100;
const LIMIT_HEIGHT = 10;

const MenuBlockMention = observer(class MenuBlockMention extends React.Component<Props, State> {

	state = {
		loading: false,
	};

	_isMounted: boolean = false;	
	filter: string = '';
	index: any = null;
	cache: any = {};
	items: any = [];
	n: number = -1;
	offset: number = 0;
	refList: any = null;

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const { filter } = commonStore;
		const { text } = filter;
		const items = this.getItems();

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const type: any = dbStore.getObjectType(item.type);

			return (
				<CellMeasurer
					key={param.key}
					parent={param.parent}
					cache={this.cache}
					columnIndex={0}
					rowIndex={param.index}
					hasFixedWidth={() => {}}
				>
					<MenuItemVertical 
						id={item.id}
						object={item.id == 'add' ? undefined : item}
						icon={item.icon}
						name={<ObjectName object={item} />}
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }}
						withCaption={true}
						caption={type ? type.name : undefined}
						style={param.style}
						className={[ (item.id == 'add' ? 'add' : ''), (item.isHidden ? 'isHidden' : '') ].join(' ')}
					/>
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
										ref={(ref: any) => { this.refList = ref; }}
										width={width}
										height={height}
										deferredMeasurmentCache={this.cache}
										rowCount={items.length}
										rowHeight={HEIGHT}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
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
		const { filter } = commonStore;
		const items = this.getItems();

		if (this.filter != filter.text) {
			this.filter = filter.text;
			this.n = -1;
			this.load(true);
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
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
		$(window).unbind('keydown.menu');
	};

	getItems () {
		return [
			{ id: 'add', name: 'Create new object', icon: 'plus', skipFilter: true }
		].concat(this.items);
	};
	
	load (clear: boolean, callBack?: (value: any) => void) {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const { skipIds } = data;

		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
		];
		const sorts = [
			{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
		];
		const filter = commonStore.filter.text.replace(/\\/g, '');

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
		};

		if (skipIds && skipIds.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};

		if (clear) {
			this.setState({ loading: true });
		};

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter, this.offset, LIMIT_LOAD, (message: any) => {
			if (callBack) {
				callBack(null);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records);

			if (clear) {
				this.setState({ loading: false });
				analytics.event('SearchQuery', { route: 'MenuMention', length: filter.length });
			} else {
				this.forceUpdate();
			};
		});
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += LIMIT_LOAD;
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

		const { param } = this.props;
		const { filter } = commonStore;
		const { data } = param;
		const { onChange } = data;

		const cb = (id: string, name: string) => {
			name = String(name || DataUtil.defaultName('page'));
			name = Util.shorten(name, 30);

			let from = filter.from;
			let to = from + name.length;
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
			const type = dbStore.getObjectType(commonStore.type);

			C.ObjectCreate({ type: type.id, name: filter.text.replace(/\\/g, '') }, (message: any) => {
				if (message.error.code) {
					return;
				};

				cb(message.pageId, filter.text);

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

		this.props.close();
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 16;
		const height = Math.max(HEIGHT * 1 + offset, Math.min(HEIGHT * LIMIT_HEIGHT, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};
	
});

export default MenuBlockMention;
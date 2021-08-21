import * as React from 'react';
import { MenuItemVertical, Loader } from 'ts/component';
import { I, C, keyboard, Util, DataUtil, Mark } from 'ts/lib';
import { commonStore, dbStore, blockStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {}

interface State {
	loading: boolean;
}

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;
const LIMIT = 10;

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
	refList: any = null;

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const items = this.getItems();
		const { filter } = commonStore;
		const { text } = filter;

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
						name={item.name}
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
						loadMoreRows={() => {}}
						isRowLoaded={({ index }) => index < items.length}
						threshold={LIMIT}
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
		this.load(false);
	};

	componentDidUpdate () {
		const { filter } = commonStore;
		const items = this.getItems();

		if (this.filter != filter.text) {
			this.load(true);
			this.filter = filter.text;
			this.n = -1;
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
	
	load (clear: boolean, callBack?: (message: any) => void) {
		const { filter } = commonStore;
		const { config } = commonStore;
		const filterMapper = (it: any) => { return this.filterMapper(it, config); };
		const filters: any[] = [
			{ 
				operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: [
					blockStore.storeType,
					blockStore.storeTemplate,
					blockStore.storeRelation,
				] 
			},
		];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
		};
		if (!config.allowDataview) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Page });
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: [ Constant.typeId.template ] });
		};

		this.setState({ loading: true });

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, filter.text, 0, 0, (message: any) => {
			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records.map((it: any) => {
				return {
					...it, 
					name: String(it.name || DataUtil.defaultName('page')),
				};
			}));
			this.items = this.items.filter(filterMapper);
			this.items.sort(DataUtil.sortByName);

			this.setState({ loading: false });
		});
	};

	filterMapper (it: any, config: any) {
		if (it.isArchived) {
			return false;
		};
		if (!config.allowDataview && (it.layout != I.ObjectLayout.Page)) {
			return false;
		};
		return true;
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

		if (item.id == 'add') {
			const name = filter.text.replace(/\\/g, '');
			C.PageCreate({ name: name }, (message: any) => {
				if (message.error.code) {
					return;
				};

				cb(message.pageId, (name || DataUtil.defaultName('page')));
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
		const height = Math.max(HEIGHT * 1 + offset, Math.min(HEIGHT * LIMIT, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};
	
});

export default MenuBlockMention;
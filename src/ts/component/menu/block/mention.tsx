import * as React from 'react';
import { MenuItemVertical } from 'ts/component';
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
const HEIGHT = 28;
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
		const items = this.getItems();
		const { filter } = commonStore;
		const { text } = filter;

		if (!this.cache) {
			return null;
		};

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
		this.load(false);
	};

	componentDidUpdate () {
		const { filter } = commonStore;
		const { n } = this.state;
		const items = this.getItems();

		if (this.filter != filter.text) {
			this.load(true);
			this.filter = filter.text;
			this.setState({ n: 0 });
			return;
		};

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
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getItems () {
		return [
			{ id: 'add', name: 'Create new page', icon: 'plus', skipFilter: true }
		].concat(this.items);
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		const { n } = this.state;
		this.props.setHover((item ? item : items[n]), scroll);
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		const { filter } = commonStore;
		const { config } = commonStore;
		const filterMapper = (it: any) => { return this.filterMapper(it, config); };
		const filters = [];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		];

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
		};
		if (!config.allowDataview) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Page });
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

	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();
		keyboard.disableMouse(true);

		let { n } = this.state;
		
		const k = e.key.toLowerCase();
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
		const obj = $('#' + getId() + ' .content');
		const height = Math.max(HEIGHT * 2, Math.min(HEIGHT * LIMIT, items.length * HEIGHT + 16));

		obj.css({ height: height });
		position();
	};
	
};

export default MenuBlockMention;
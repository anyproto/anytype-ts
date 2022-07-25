import * as React from 'react';
import { Filter, Icon, Loader } from 'ts/component';
import { I, Util, DataUtil, analytics, keyboard } from 'ts/lib';
import { commonStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
};

const $ = require('jquery');
const Constant = require('json/constant.json');

const HEIGHT = 28;
const LIMIT = 20;

const MenuRelationSuggest = observer(class MenuRelationSuggest extends React.Component<Props, State> {

	state = {
		loading: false,
	};
	_isMounted: boolean = false;	
	filter: string = '';
	cache: any = {};
	items: any[] = [];
	refFilter: any = null;
	refList: any = null;
	n: number = -1;

	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { loading } = this.state;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems();

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			let content = null;
			if (item.id == 'add') {
				content =  (
					<div 
						id="item-add" 
						className="item add" 
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }} 
						style={param.style}
					>
						<Icon className="plus" />
						<div className="name">{item.name}</div>
					</div>
				);
			} else {
				content = (
					<div 
						id={'item-' + item.relationKey} 
						className={[ 'item', (item.isHidden ? 'isHidden' : '') ].join(' ')}
						style={param.style}
						onMouseEnter={(e: any) => { this.onOver(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }}
					>
						<Icon className={'relation ' + DataUtil.relationClass(item.format)} />
						<div className="name">{item.name}</div>
					</div>
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
					placeholderFocus="Filter objects..." 
					value={filter}
					onChange={this.onFilterChange} 
				/>

				<div className="items">
					{loading ? <Loader / > : (
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
											ref={(ref: any) => { this.refList = ref; }}
											width={width}
											height={height}
											deferredMeasurmentCache={this.cache}
											rowCount={items.length}
											rowHeight={HEIGHT}
											rowRenderer={rowRenderer}
											onRowsRendered={onRowsRendered}
											overscanRowCount={LIMIT}
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
		this.focus();
		this.load();
	};

	componentDidUpdate () {
		const items = this.getItems();
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (filter != this.filter) {
			this.load();
			this.filter = filter;
			this.n = -1;
			this.props.setActive();
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
		this.focus();
		this.props.setActive();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};

	focus () {
		window.setTimeout(() => { 
			if (this.refFilter) {
				this.refFilter.focus(); 
			};
		}, 15);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const skipIds = (data.skipIds || []).concat(Constant.systemRelationKeys);
		const name = data.filter ? `Create relation "${data.filter}"` : 'Create from scratch';

		let ret: any[] = [ { relationKey: 'add', name: name } ];

		ret = ret.concat(this.items);
		ret = ret.filter((it: any) => { return skipIds.indexOf(it.relationKey) < 0; });

		if (data.filter) {
			const filter = new RegExp(Util.filterFix(data.filter), 'gi');
			ret = ret.filter(it => it.name.match(filter));
		};

		if (!config.debug.ho) {
			ret = ret.filter(it => !it.isHidden);
		};

		ret = ret.map((it: any) => {
			it.id = it.relationKey;
			return it;
		});

		return ret;
	};
	
	load () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, listCommand } = data;

		this.setState({ loading: true });

		if (listCommand) {
			listCommand(rootId, blockId, (message: any) => {
				this.items = (message.relations || []).sort(DataUtil.sortByName);
				this.setState({ loading: false });
			});
		};
	};

	onFilterChange (v: string) {
		this.props.param.data.filter = v;
	};

	onOver (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
		};
	};
	
	onClick (e: any, item: any) {
		const { close, param, getId } = this.props;
		const { data, classNameWrap } = param;
		const { rootId, blockId, menuIdEdit, addCommand, onAdd, ref, onChange } = data;

		e.preventDefault();
		e.stopPropagation();

		if (!item) {
			close();
			return;
		};

		if (item.id == 'add') {
			const obj = $(`#${getId()}`);

			menuStore.open(menuIdEdit, { 
				element: `#${getId()} #item-${item.id}`,
				offsetX: obj.outerWidth(),
				offsetY: -76,
				noAnimation: true,
				classNameWrap: classNameWrap,
				data: {
					...data,
					onChange: (relation: any) => { 
						close(); 
						
						if (onAdd) {
							onAdd();
						};

						analytics.event('CreateRelation', { format: relation.format, type: ref });
					},
					rebind: this.rebind,
				}
			});
		} else 
		if (addCommand) {
			close(); 
			addCommand(rootId, blockId, item, onChange);
			analytics.event('AddExistingRelation', { format: item.format, type: ref });
		};
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const offset = 68;
		const height = Math.max(HEIGHT * 1 + offset, Math.min(360, items.length * HEIGHT + offset));

		obj.css({ height: height });
		position();
	};

});

export default MenuRelationSuggest;
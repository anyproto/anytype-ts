import * as React from 'react';
import { Filter, Icon } from 'ts/component';
import { I, Util, DataUtil, Key, keyboard } from 'ts/lib';
import { commonStore, menuStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

interface State {
	n: number;
	loading: boolean;
};

const $ = require('jquery');
const HEIGHT = 28;
const LIMIT = 20;

@observer
class MenuRelationSuggest extends React.Component<Props, State> {

	state = {
		loading: false,
		n: 0,
	};

	_isMounted: boolean = false;	
	filter: string = '';
	cache: any = null;
	offset: number = 0;
	items: any[] = [];
	ref: any = null;

	constructor (props: any) {
		super(props);
		
		this.rebind = this.rebind.bind(this);
		this.onClick = this.onClick.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const { n } = this.state;
		const items = this.getItems();

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];

			let content = null;
			if (item.id == 'add') {
				content =  (
					<div 
						id="item-add" className="item add" 
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
					ref={(ref: any) => { this.ref = ref; }} 
					placeholderFocus="Filter objects..." 
					value={filter}
					onChange={this.onFilterChange} 
				/>

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
										rowHeight={HEIGHT}
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
		const { n } = this.state;
		const items = this.getItems();
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;

		if (filter != this.filter) {
			this.offset = 0;
			this.filter = filter;
			this.load();
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
		this.focus();
		this.setActive(items[n]);
	};
	
	componentWillUnmount () {
		const { param } = this.props;
		const { data } = param;
		const { rebind } = data;

		this._isMounted = false;
		this.unbind();
		
		if (rebind) {
			rebind();
		};
	};

	focus () {
		window.setTimeout(() => { 
			if (this.ref) {
				this.ref.focus(); 
			};
		}, 15);
	};

	rebind () {
		this.unbind();

		$(window).on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	getItems () {
		const { config } = commonStore;
		const { param } = this.props;
		const { data } = param;
		const skipIds = data.skipIds || [];

		let ret = [];
		let name = 'Create from scratch';

		ret = ret.concat(this.items);

		if (data.filter) {
			const filter = new RegExp(Util.filterFix(data.filter), 'gi');
			ret = ret.filter((it: any) => { return it.name.match(filter); });
			name = `Create relation "${data.filter}"`;
		};

		if (skipIds.length) {
			ret = ret.filter((it: any) => { return skipIds.indexOf(it.relationKey) < 0; });
		};

		if (!config.debug.ho) {
			ret = ret.filter((it: I.Relation) => { return !it.isHidden; });
		};

		ret.unshift({ id: 'add', relationKey: 'add', name: name });

		return ret;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		const { n } = this.state;

		item = item || items[n] || {};
		this.props.setHover({ id: item.relationKey }, scroll);
	};

	load () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, blockId, listCommand } = data;

		this.setState({ loading: true });

		if (listCommand) {
			listCommand(rootId, blockId, (message: any) => {
				this.items = message.relations.sort(DataUtil.sortByName);
				this.setState({ loading: false });
			});
		};
	};

	onFilterChange (v: string) {
		this.props.param.data.filter = v;
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
		const { close, param, getId } = this.props;
		const { data, classNameWrap } = param;
		const { rootId, blockId, menuIdEdit, addCommand, onAdd } = data;

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
				subIds: [ 'relationType' ],
				classNameWrap: classNameWrap,
				data: {
					...data,
					onChange: () => { 
						close(); 
						if (onAdd) {
							onAdd();
						};
					},
					rebind: this.rebind,
				}
			});
		} else 
		if (addCommand) {
			addCommand(rootId, blockId, item);
		};
	};

	resize () {
		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $('#' + getId() + ' .content');
		const height = Math.max(HEIGHT * 2, Math.min(280, items.length * HEIGHT + 58));

		obj.css({ height: height });
		position();
	};

};

export default MenuRelationSuggest;
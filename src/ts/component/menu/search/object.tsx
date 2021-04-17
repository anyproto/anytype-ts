import * as React from 'react';
import { MenuItemVertical, Filter, Loader, Label } from 'ts/component';
import { I, C, Key, keyboard, Util, crumbs, DataUtil, translate } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import 'react-virtualized/styles.css';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
	n: number;
	filter: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const HEIGHT = 28;
const LIMIT = 10;

@observer
class MenuSearchObject extends React.Component<Props, State> {

	state = {
		loading: false,
		n: 0,
		filter: '',
	};

	_isMounted: boolean = false;	
	filter: string = '';
	index: any = null;
	cache: any = null;
	items: any = [];
	ref: any = null;
	timeoutFilter: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { n, loading, filter } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { value, placeHolder, label } = data;
		const items = this.getItems();
		const cn = [ 'wrap', (label ? 'withLabel' : '') ];
		const placeHolderFocus = data.placeHolderFocus || 'Filter objects...';

		if (!this.cache) {
			return null;
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const type: any = dbStore.getObjectType(item.type);
			const cn = [];
			
			if (item.id == 'add') {
				cn.push('add');
			};
			if (item.isHidden) {
				cn.push('isHidden');
			};
			if (value == item.id) {
				cn.push('active');
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
						className={cn.join(' ')}
					/>
				</CellMeasurer>
			);
		};

		return (
			<div className={cn.join(' ')}>
				{loading ? <Loader /> : ''}

				<Filter 
					ref={(ref: any) => { this.ref = ref; }} 
					placeHolder={placeHolder} 
					placeHolderFocus={placeHolderFocus} 
					onChange={(e: any) => { this.onKeyUp(e, false); }} 
				/>

				{!items.length && !loading ? (
					<div id="empty" key="empty" className="empty">
						<Label text={Util.sprintf(translate('popupSearchEmptyFilter'), filter)} />
					</div>
				) : ''}

				{this.cache && items.length && !loading ? (
					<React.Fragment>
						{label ? <div className="sectionName">{label}</div> : ''}

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
					</React.Fragment>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.focus();
		this.load(false);
	};

	componentDidUpdate () {
		const { n, filter } = this.state;
		const items = this.getItems();

		if (this.filter != filter) {
			this.load(true);
			this.filter = filter;
			this.setState({ n: 0 });
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

	focus () {
		window.setTimeout(() => {
			if (this.ref) {
				this.ref.focus();
			};
		}, 15);
	};

	getItems () {
		return this.items;
	};
	
	setActive = (item?: any, scroll?: boolean) => {
		const items = this.getItems();
		const { n } = this.state;
		this.props.setHover((item ? item : items[n]), scroll);
	};

	load (clear: boolean, callBack?: (message: any) => void) {
		if (!this._isMounted) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { filter } = this.state;
		const { config } = commonStore;
		const filterMapper = (it: any) => { return this.filterMapper(it, config); };
		
		const filters: any[] = data.filters || [];
		const sorts = [
			{ relationKey: 'name', type: I.SortType.Asc },
		].concat(data.sorts || []);

		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.NotEqual, value: true });
		};
		if (!config.allowDataview) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: [ Constant.typeId.template ] });
		};

		this.setState({ loading: true });

		C.ObjectSearch(filters, sorts, filter, 0, 0, (message: any) => {
			if (!this._isMounted) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records.map((it: any) => {
				return {
					...it, 
					name: String(it.name || Constant.default.name),
				};
			}));
			this.items = this.items.filter(filterMapper);

			this.setState({ loading: false });
		});
	};

	filterMapper (it: any, config: any) {
		const { param } = this.props;
		const { data } = param;
		const { type, skipId } = data;

		if (it.isArchived) {
			return false;
		};
		if (it.id == skipId) {
			return false;
		};
		if (!config.allowDataview && (it.layout != I.ObjectLayout.Page) && (it.id != Constant.typeId.page)) {
			return false;
		};
		if ((type == I.NavigationType.Move) && ([ I.ObjectLayout.Page, I.ObjectLayout.Human, I.ObjectLayout.Task, I.ObjectLayout.Dashboard ].indexOf(it.layout) < 0)) {
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
		e.persist();
		e.stopPropagation();

		const { param, close } = this.props;
		const { data } = param;
		const { rootId, type, blockId, blockIds, position, onSelect } = data;

		close();

		if (onSelect) {
			onSelect(item);
		};

		if (!type) {
			return;
		};

		let newBlock: any = {};

		switch (type) {
			case I.NavigationType.Go:
				crumbs.cut(I.CrumbsType.Page, 0, () => {
					DataUtil.objectOpenEvent(e, item);
				});
				break;

			case I.NavigationType.Move:
				C.BlockListMove(rootId, item.id, blockIds, '', I.BlockPosition.Bottom);
				break;

			case I.NavigationType.Link:
				newBlock = {
					type: I.BlockType.Link,
					content: {
						targetBlockId: String(item.id || ''),
					}
				};
				C.BlockCreate(newBlock, rootId, blockId, position);
				break;

			case I.NavigationType.LinkTo:
				newBlock = {
					type: I.BlockType.Link,
					content: {
						targetBlockId: blockId,
					}
				};
				C.BlockCreate(newBlock, item.id, '', position);
				break;
		};
	};

	onKeyUp (e: any, force: boolean) {
		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			this.setState({ filter: Util.filterFix(this.ref.getValue()) });
		}, force ? 0 : 50);
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { getId, position } = this.props;
		const items = this.getItems();
		const obj = $('#' + getId() + ' .content');
		const height = Math.max(300, Math.min(HEIGHT * LIMIT, items.length * HEIGHT + 16));

		obj.css({ height: height });
		position();
	};
	
};

export default MenuSearchObject;
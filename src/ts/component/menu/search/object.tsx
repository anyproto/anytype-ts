import * as React from 'react';
import { MenuItemVertical, Filter, Loader, Label, ObjectName } from 'ts/component';
import { I, C, keyboard, Util, crumbs, DataUtil, translate, analytics } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';

interface Props extends I.Menu {};

interface State {
	loading: boolean;
	filter: string;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const LIMIT = 10;

const MenuSearchObject = observer(class MenuSearchObject extends React.Component<Props, State> {

	state = {
		loading: false,
		filter: '',
	};

	_isMounted: boolean = false;	
	filter: string = '';
	index: any = null;
	cache: any = {};
	items: any = [];
	refFilter: any = null;
	refList: any = null;
	n: number = -1;
	timeoutFilter: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};
	
	render () {
		const { loading, filter } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { value, placeholder, label, isBig, noFilter, noIcon } = data;
		const items = this.getItems();
		const cn = [ 'wrap' ];
		const placeholderFocus = data.placeholderFocus || 'Filter objects...';
		const rowHeight = this.getHeight();

		if (label) {
			cn.push('withLabel');
		};
		if (!noFilter) {
			cn.push('withFilter');
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

			const props = {
				...item,
				object: (item.id == 'add' ? undefined : item),
			};

			if (isBig) {
				props.withDescription = true;
				props.forceLetter = true;
				props.iconSize = 40;
			} else {
				props.withCaption = true;
				props.caption = (type ? type.name : undefined);
			};

			if (noIcon) {
				props.object = undefined;
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
						{...props}
						name={<ObjectName object={item} />}
						onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }} 
						onClick={(e: any) => { this.onClick(e, item); }}
						style={param.style}
						className={cn.join(' ')}
					/>
				</CellMeasurer>
			);
		};

		return (
			<div className={cn.join(' ')}>
				{!noFilter ? (
					<Filter 
						ref={(ref: any) => { this.refFilter = ref; }} 
						placeholder={placeholder} 
						placeholderFocus={placeholderFocus} 
						value={filter}
						onChange={(e: any) => { this.onKeyUp(e, false); }} 
					/>
				) : ''}

				{loading ? <Loader /> : ''}

				{!items.length && !loading ? (
					<div id="empty" key="empty" className="emptySearch">
						<div className="label">
							{filter ? (
								<React.Fragment>
									<b>There are no objects named <span>"{filter}"</span></b>
									Try creating a new one or search for something else.
								</React.Fragment>
							) : translate('popupSearchEmpty')}
						</div>
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
												ref={(ref: any) => { this.refList = ref; }}
												width={width}
												height={height}
												deferredMeasurmentCache={this.cache}
												rowCount={items.length}
												rowHeight={rowHeight}
												rowRenderer={rowRenderer}
												onRowsRendered={onRowsRendered}
												overscanRowCount={10}
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
		const { filter } = this.state;
		const items = this.getItems();
		const rowHeight = this.getHeight();

		if (this.filter != filter) {
			this.load(true);
			this.filter = filter;
			this.n = -1;
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: rowHeight,
			keyMapper: (i: number) => { return (items[i] || {}).id; },
		});

		this.resize();
		this.focus();
		this.props.setActive();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeoutFilter);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', (e: any) => { this.props.onKeyDown(e); });
		window.setTimeout(() => { this.props.setActive(); }, 15);
	};
	
	unbind () {
		$(window).unbind('keydown.menu');
	};

	focus () {
		window.setTimeout(() => {
			if (this.refFilter) {
				this.refFilter.focus();
			};
		}, 15);
	};

	getItems () {
		return this.items;
	};
	
	load (clear: boolean, callBack?: (message: any) => void) {
		if (!this._isMounted) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { type, dataMapper, dataSort, skipIds } = data;
		const { filter } = this.state;
		const { config } = commonStore;
		
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'isArchived', condition: I.FilterCondition.Equal, value: false },
		].concat(data.filters || []);

		const sorts = [
			{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
		].concat(data.sorts || []);

		if (skipIds && skipIds.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};
		if (!config.debug.ho) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isHidden', condition: I.FilterCondition.Equal, value: false });
		};
		if (type == I.NavigationType.Move) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isReadonly', condition: I.FilterCondition.Equal, value: false });
		};

		this.setState({ loading: true });

		C.ObjectSearch(filters, sorts, Constant.defaultRelationKeys, Util.filterFix(filter), 0, 0, (message: any) => {
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
					name: String(it.name || DataUtil.defaultName('page')),
				};
			}));

			if (dataMapper) {
				this.items = this.items.map(dataMapper);
			};

			if (dataSort) {
				this.items.sort(dataSort);
			};

			analytics.event('SearchQuery', { route: 'MenuSearch', length: filter.length });
			this.setState({ loading: false });
		});
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};

	onOver (e: any, item: any) {
		const { param } = this.props;
		const { data } = param;
		const { onOver } = data;

		if (onOver) {
			onOver(e, this, item);
		};
	};
	
	onClick (e: any, item: any) {
		e.stopPropagation();

		const { param, close } = this.props;
		const { data } = param;
		const { rootId, type, blockId, blockIds, position, onSelect, noClose } = data;

		if (!noClose) {
			close();
		};

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
					},
					fields: DataUtil.defaultLinkSettings(),
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
			this.setState({ filter: this.refFilter.getValue() });
		}, force ? 0 : 500);
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const { param, getId, position } = this.props;
		const { data } = param;
		const { noFilter, label } = data;
		const items = this.getItems();
		const obj = $(`#${getId()} .content`);
		const h = this.getHeight();
		const min = noFilter ? 44 + 28 : 300;
		const l = items.length + (label ? 1 : 0);
		const height = Math.max(min, Math.min(h * LIMIT, l * h + 16));

		obj.css({ height: height });
		position();
	};

	getHeight () {
		return this.props.param.data.isBig ? 56 : 28;
	};
	
});

export default MenuSearchObject;
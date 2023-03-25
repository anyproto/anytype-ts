import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { MenuItemVertical, Filter, Loader, ObjectName, EmptySearch } from 'Component';
import { I, C, keyboard, Util, DataUtil, ObjectUtil, Preview, analytics, Action, focus, translate } from 'Lib';
import { commonStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	loading: boolean;
};

const LIMIT = 10;
const HEIGHT_SECTION = 28;
const HEIGHT_ITEM = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_DIV = 16;

const MenuSearchObject = observer(class MenuSearchObject extends React.Component<I.Menu, State> {

	state = {
		loading: false,
	};

	_isMounted = false;	
	filter = '';
	index: any = null;
	cache: any = {};
	items: any = [];
	refFilter: any = null;
	refList: any = null;
	n = -1;
	timeoutFilter = 0;
	offset = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { loading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { filter, value, placeholder, label, isBig, noFilter, noIcon } = data;
		const items = this.getItems();
		const cn = [ 'wrap' ];
		const placeholderFocus = data.placeholderFocus || 'Filter objects...';

		if (label) {
			cn.push('withLabel');
		};
		if (!noFilter) {
			cn.push('withFilter');
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			const type = dbStore.getType(item.type);
			const checkbox = value && value.length && value.includes(item.id);
			const cn = [];

			let content = null;

			if (item.isSection) {
				content = <div className={[ 'sectionName', (param.index == 0 ? 'first' : '') ].join(' ')} style={param.style}>{item.name}</div>;
			} else
			if (item.isDiv) {
				content = (
					<div className="separator" style={param.style}>
						<div className="inner" />
					</div>
				);
			} else {
				const props = {
					...item,
					object: (item.isAdd ? undefined : item),
				};

				if (item.isAdd) {
					cn.push('add');
				};
				if (item.isHidden) {
					cn.push('isHidden');
				};

				if (isBig && !item.isAdd) {
					props.withDescription = true;
					props.forceLetter = true;
					props.iconSize = 40;
				} else {
					props.caption = (type ? type.name : undefined);
				};

				if (noIcon) {
					props.object = undefined;
				};

				content = (
					<MenuItemVertical
						{...props}
						name={<ObjectName object={item} />}
						onMouseEnter={(e: any) => { this.onMouseEnter(e, item); }}
						onClick={(e: any) => { this.onClick(e, item); }}
						style={param.style}
						checkbox={checkbox}
						className={cn.join(' ')}
					/>
				);
			}

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
			<div className={cn.join(' ')}>
				{!noFilter ? (
					<Filter 
						ref={ref => { this.refFilter = ref; }} 
						placeholder={placeholder} 
						placeholderFocus={placeholderFocus} 
						value={filter}
						onChange={this.onFilterChange} 
					/>
				) : ''}

				{loading ? <Loader /> : ''}

				{!items.length && !loading ? (
					<EmptySearch text={filter ? Util.sprintf(translate('popupSearchEmptyFilter'), filter) : translate('popupSearchEmpty')} />
				) : ''}

				{this.cache && items.length && !loading ? (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length + 1}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!this.items[index]}
							threshold={LIMIT}
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
					</div>
				) : ''}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
		this.resize();
		this.focus();
		this.load(true);
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems();

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
		$(window).off('keydown.menu');
	};

	focus () {
		window.setTimeout(() => {
			if (this.refFilter) {
				this.refFilter.focus();
			};
		}, 15);
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { filter, label, canAdd, addParam } = data;

		let items = [].concat(this.items);
		let length = items.length;

		if (label && length) {
			items.unshift({ isSection: true, name: label });
		};

		if (canAdd) {
			if (length && (addParam || filter)) {
				items.push({ isDiv: true });
			};

			if (addParam) {
				items.push({ id: 'add', icon: 'plus', name: addParam.name, isAdd: true });
			} else
			if (filter) {
				items.push({ id: 'add', icon: 'plus', name: `Create object "${filter}"`, isAdd: true });
			};
		};

		return items;
	};

	loadMoreRows ({ startIndex, stopIndex }) {
        return new Promise((resolve, reject) => {
			this.offset += Constant.limit.menuRecords;
			this.load(false, resolve);
		});
	};
	
	load (clear: boolean, callBack?: (message: any) => void) {
		if (!this._isMounted) {
			return;
		};

		const { loading } = this.state;
		if (loading) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { type, dataMapper, dataSort, dataChange, skipIds, keys, ignoreWorkspace } = data;
		const filter = String(data.filter || '');
		
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: [ Constant.typeId.option ] },
		].concat(data.filters || []);

		const sorts = [].concat(data.sorts || []);

		if (!sorts.length) {
			sorts.push({ relationKey: 'lastOpenedDate', type: I.SortType.Desc });
		};

		if (skipIds && skipIds.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};
		if ([ I.NavigationType.Move, I.NavigationType.LinkTo ].includes(type)) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isReadonly', condition: I.FilterCondition.Equal, value: false });
		};

		if (clear) {
			this.setState({ loading: true });
		};

		DataUtil.search({
			filters,
			sorts,
			keys: keys || Constant.defaultRelationKeys,
			fullText: filter,
			offset: this.offset,
			limit: Constant.limit.menuRecords,
			ignoreWorkspace: (typeof ignoreWorkspace === 'undefined' ? false : ignoreWorkspace),
		}, (message: any) => {
			if (!this._isMounted) {
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records);

			if (clear && dataChange) {
				this.items = dataChange(this.items);
			};

			if (dataMapper) {
				this.items = this.items.map(dataMapper);
			};

			if (dataSort) {
				this.items.sort(dataSort);
			};

			if (clear) {
				this.setState({ loading: false });
			} else {
				this.forceUpdate();
			};
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
		const { filter, rootId, type, blockId, blockIds, position, onSelect, noClose } = data;
		const addParam: any = data.addParam || {};

		if (!noClose) {
			close();
		};

		let newBlock: any = {};

		const process = (target: any, isNew: boolean) => {
			if (onSelect) {
				onSelect(target, isNew);
			};

			if (!type) {
				return;
			};

			switch (type) {
				case I.NavigationType.Go:
					ObjectUtil.openEvent(e, target);
					break;

				case I.NavigationType.Move:
					Action.move(rootId, target.id, '', blockIds, I.BlockPosition.Bottom, (message: any) => {
						if (message.error.code) {
							return;
						};

						Preview.toastShow({
							action: I.ToastAction.Move,
							targetId: target.id,
							count: blockIds.length,
							originId: rootId,
						});
					});
					break;

				case I.NavigationType.Link:
					switch (item.type) {
						case Constant.typeId.bookmark:
							newBlock.type = I.BlockType.Bookmark;
							newBlock.content = {
								state: I.BookmarkState.Done,
								targetObjectId: target.id,
							};
							break;

						default:
							newBlock.type = I.BlockType.Link;
							newBlock.content = {
								...DataUtil.defaultLinkSettings(),
								targetBlockId: target.id,
							};
							break;
					};

					C.BlockCreate(rootId, blockId, position, newBlock, (message: any) => {
						if (message.error.code) {
							return;
						};

						focus.set(message.blockId, { from: 0, to: 0 });
						focus.apply();

						analytics.event('CreateLink');
					});
					break;

				case I.NavigationType.LinkTo:
					const cb = (message: any) => {
						if (message.error.code) {
							return;
						};

						const action = target.type == Constant.typeId.collection ? I.ToastAction.Collection : I.ToastAction.Link;

						Preview.toastShow({ action, objectId: blockId, targetId: target.id });
						analytics.event('LinkToObject', { objectType: target.type });
					};

					if (target.type == Constant.typeId.collection) {
						C.ObjectCollectionAdd(rootId, [ target.id ], cb);
					} else {
						newBlock = {
							type: I.BlockType.Link,
							content: {
								...DataUtil.defaultLinkSettings(),
								targetBlockId: blockId,
							}
						};

						C.BlockCreate(target.id, '', position, newBlock, cb);
					};
					break;
			};
		};

		if (item.isAdd) {
			if (addParam.onClick) {
				addParam.onClick();
				close();
			} else {
				ObjectUtil.create('', '', { name: filter, type: commonStore.type }, I.BlockPosition.Bottom, '', {}, [ I.ObjectFlag.SelectType ], (message: any) => {
					DataUtil.getObjectById(message.targetId, (object: any) => { process(object, true); });
					close();
				});
			};
		} else {
			process(item, false);
		};
	};

	onFilterChange (v: string) {
		const { param } = this.props;
		const { data } = param;
		const { onFilterChange } = data;

		window.clearTimeout(this.timeoutFilter);
		this.timeoutFilter = window.setTimeout(() => {
			const filter = this.refFilter.getValue();

			this.props.param.data.filter = filter;

			if (onFilterChange) {
				onFilterChange(filter);
			};
		}, 500);
	};

	getRowHeight (item: any) {
		const { param } = this.props;
		const { data } = param;
		const { isBig } = data;

		let h = HEIGHT_ITEM;
		if ((isBig || item.isBig) && !item.isAdd)	 h = HEIGHT_ITEM_BIG;
		if (item.isSection)							 h = HEIGHT_SECTION;
		if (item.isDiv)								 h = HEIGHT_DIV;
		return h;
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const { loading } = this.state;
		const items = this.getItems().slice(0, LIMIT);
		const obj = $(`#${getId()} .content`);

		let height = items.reduce((res: number, current: any) => { return res + this.getRowHeight(current); }, 16 + (noFilter ? 0 : 44));
		if (loading) {
			height += 40;
		};
		if (!loading && !items.length) {
			height = 300;
		};

		obj.css({ height });
		position();
	};
	
});

export default MenuSearchObject;
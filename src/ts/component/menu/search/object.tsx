import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { MenuItemVertical, Filter, Loader, ObjectName, EmptySearch } from 'Component';
import { I, C, keyboard, UtilCommon, UtilData, UtilObject, Preview, analytics, Action, focus, translate, UtilSpace } from 'Lib';
import { commonStore, dbStore, detailStore } from 'Store';
const Constant = require('json/constant.json');

interface State {
	isLoading: boolean;
};

const LIMIT = 10;
const HEIGHT_SECTION = 28;
const HEIGHT_ITEM_SMALL = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_DIV = 16;

const MenuSearchObject = observer(class MenuSearchObject extends React.Component<I.Menu, State> {

	state = {
		isLoading: false,
	};

	_isMounted = false;	
	filter = '';
	index: any = null;
	cache: any = {};
	items: any = [];
	refFilter: any = null;
	refList: any = null;
	n = 0;
	timeoutFilter = 0;
	offset = 0;

	constructor (props: I.Menu) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onFilterChange = this.onFilterChange.bind(this);
		this.loadMoreRows = this.loadMoreRows.bind(this);
	};
	
	render () {
		const { isLoading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { filter, value, placeholder, label, isBig, noFilter, noIcon, onMore } = data;
		const items = this.getItems();
		const cn = [ 'wrap' ];
		const placeholderFocus = data.placeholderFocus || translate('commonFilterObjects');

		if (label) {
			cn.push('withLabel');
		};
		if (!noFilter) {
			cn.push('withFilter');
		};

		const rowRenderer = (param: any) => {
			const item: any = items[param.index];
			if (!item) {
				return null;
			};

			const type = dbStore.getTypeById(item.type);
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
					props.isAdd = true;
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

				if (undefined !== item.caption) {
					props.caption = item.caption;
				};

				if (noIcon) {
					props.object = undefined;
				};

				content = (
					<MenuItemVertical
						{...props}
						name={<ObjectName object={item} />}
						onMouseEnter={e => this.onMouseEnter(e, item)}
						onClick={e => this.onClick(e, item)}
						onMore={onMore ? e => onMore(e, item) : undefined}
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
						ref={ref => this.refFilter = ref}
						className="outlined"
						placeholder={placeholder} 
						placeholderFocus={placeholderFocus} 
						value={filter}
						onChange={this.onFilterChange} 
						focusOnMount={true}
					/>
				) : ''}

				{isLoading ? <Loader /> : ''}

				{!items.length && !isLoading ? (
					<EmptySearch text={filter ? UtilCommon.sprintf(translate('popupSearchEmptyFilter'), filter) : translate('popupSearchEmpty')} />
				) : ''}

				{this.cache && items.length && !isLoading ? (
					<div className="items">
						<InfiniteLoader
							rowCount={items.length + 1}
							loadMoreRows={this.loadMoreRows}
							isRowLoaded={({ index }) => !!this.items[index]}
							threshold={LIMIT}
						>
							{({ onRowsRendered }) => (
								<AutoSizer className="scrollArea">
									{({ width, height }) => (
										<List
											ref={ref => this.refList = ref}
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
		this.load(true);
	};

	componentDidUpdate () {
		const { param } = this.props;
		const { data } = param;
		const { filter } = data;
		const items = this.getItems();

		if (this.filter != filter) {
			this.n = 0;
			this.filter = filter;
			this.reload();
			return;
		};

		this.cache = new CellMeasurerCache({
			fixedWidth: true,
			defaultHeight: HEIGHT_ITEM_SMALL,
			keyMapper: i => (items[i] || {}).id,
		});

		this.resize();
		this.rebind();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		window.clearTimeout(this.timeoutFilter);
	};

	rebind () {
		this.unbind();
		$(window).on('keydown.menu', e => this.props.onKeyDown(e));
		window.setTimeout(() => this.props.setActive(), 15);
	};
	
	unbind () {
		$(window).off('keydown.menu');
	};

	getItems () {
		const { param } = this.props;
		const { data } = param;
		const { filter, label, canAdd, addParam } = data;
		const length = this.items.length;
		const items = [].concat(this.items);
		const canWrite = UtilSpace.canMyParticipantWrite();
		
		if (label && length) {
			items.unshift({ isSection: true, name: label });
		};

		if (canAdd && canWrite) {
			if (length && (addParam || filter)) {
				items.push({ isDiv: true });
			};

			if (addParam) {
				items.push({ id: 'add', icon: 'plus', name: addParam.name, isAdd: true });
			} else
			if (filter) {
				items.push({ id: 'add', icon: 'plus', name: UtilCommon.sprintf(translate('commonCreateObject'), filter), isAdd: true });
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

	reload () {
		this.n = 0;
		this.offset = 0;
		this.load(true);
	};
	
	load (clear: boolean, callBack?: (message: any) => void) {
		if (!this._isMounted) {
			return;
		};

		const { isLoading } = this.state;
		if (isLoading) {
			return;
		};

		const { param } = this.props;
		const { data } = param;
		const { type, dataMapper, dataSort, dataChange, skipIds, keys, ignoreWorkspace } = data;
		const filter = String(data.filter || '');
		const templateType = dbStore.getTemplateType();
		
		const filters: any[] = [
			{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: [ I.ObjectLayout.Option ] },
		].concat(data.filters || []);

		const sorts = [].concat(data.sorts || []);

		if (!sorts.length) {
			sorts.push({ relationKey: 'lastOpenedDate', type: I.SortType.Desc });
			sorts.push({ relationKey: 'type', type: I.SortType.Asc });
		};

		if (skipIds && skipIds.length) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};
		if ([ I.NavigationType.Move, I.NavigationType.LinkTo ].includes(type)) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'isReadonly', condition: I.FilterCondition.Equal, value: false });
		};
		if ([ I.NavigationType.Move, I.NavigationType.LinkTo, I.NavigationType.Link ].includes(type)) {
			filters.push({ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.NotIn, value: UtilObject.getSystemLayouts() });
			filters.push({ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotEqual, value: templateType?.id });
		};

		if (clear) {
			this.setState({ isLoading: true });
		};

		UtilData.search({
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

			if (message.error.code) {
				this.setState({ isLoading: false });
				return;
			};

			if (callBack) {
				callBack(message);
			};

			if (clear) {
				this.items = [];
			};

			this.items = this.items.concat(message.records || []);

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
				this.setState({ isLoading: false });
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
		const object = detailStore.get(rootId, blockId);

		let details = data.details || {};

		if (!noClose) {
			close();
		};

		const process = (target: any, isNew: boolean) => {
			if (onSelect) {
				onSelect(target, isNew);
			};

			if (!type) {
				return;
			};

			switch (type) {
				case I.NavigationType.Go:
					UtilObject.openEvent(e, target);
					break;

				case I.NavigationType.Move:
					Action.move(rootId, target.id, '', blockIds, I.BlockPosition.Bottom);
					break;

				case I.NavigationType.Link:
					C.BlockCreate(rootId, blockId, position, this.getBlockParam(target.id, item.layout), (message: any) => {
						if (message.error.code) {
							return;
						};

						focus.set(message.blockId, { from: 0, to: 0 });
						focus.apply();

						analytics.event('CreateLink');
					});
					break;

				case I.NavigationType.LinkTo:
					const isCollection = target.layout == I.ObjectLayout.Collection;
					const cb = (message: any) => {
						if (message.error.code) {
							return;
						};

						const action = isCollection ? I.ToastAction.Collection : I.ToastAction.Link;
						const linkType = isCollection ? 'Collection' : 'Object';

						Preview.toastShow({ action, objectId: blockId, targetId: target.id });
						analytics.event('LinkToObject', { objectType: target.type, linkType });
					};

					if (isCollection) {
						C.ObjectCollectionAdd(target.id, [ rootId ], cb);
					} else {
						C.BlockCreate(target.id, '', position, this.getBlockParam(blockId, object.layout), cb);
					};
					break;
			};
		};



		if (item.isAdd) {
			details = { name: filter, ...details };

			if (addParam.onClick) {
				addParam.onClick(details);
				close();
			} else {
				const flags = [ I.ObjectFlag.SelectType, I.ObjectFlag.SelectTemplate ];

				UtilObject.create('', '', details, I.BlockPosition.Bottom, '', flags, 'Search', (message: any) => {
					process(message.details, true);
					close();
				});
			};
		} else {
			process(item, false);
		};
	};

	getBlockParam (id: string, layout: I.ObjectLayout) {
		const param: Partial<I.Block> = {};

		if (UtilObject.isFileLayout(layout)) {
			return {
				type: I.BlockType.File,
				content: {
					targetObjectId: id,
					style: I.FileStyle.Embed,
					state: I.FileState.Done,
					type: UtilObject.getFileTypeByLayout(layout),
				},
			};
		};

		switch (layout) {
			case I.ObjectLayout.Bookmark: {
				param.type = I.BlockType.Bookmark;
				param.content = {
					state: I.BookmarkState.Done,
					targetObjectId: id,
				};
				break;
			};

			default: {
				param.type = I.BlockType.Link;
				param.content = {
					...UtilData.defaultLinkSettings(),
					targetBlockId: id,
				};
				break;
			};
		};

		return param;
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
		}, Constant.delay.keyboard);
	};

	getRowHeight (item: any) {
		if (!item) {
			return HEIGHT_ITEM_SMALL;
		};

		const { param } = this.props;
		const { data } = param;
		const { isBig } = data;

		let h = HEIGHT_ITEM_SMALL;
		if ((isBig || item.isBig) && !item.isAdd)	 h = HEIGHT_ITEM_BIG;
		if (item.isSection)							 h = HEIGHT_SECTION;
		if (item.isDiv)								 h = HEIGHT_DIV;
		return h;
	};

	resize () {
		const { getId, position, param } = this.props;
		const { data } = param;
		const { noFilter } = data;
		const { isLoading } = this.state;
		const items = this.getItems().slice(0, LIMIT);
		const obj = $(`#${getId()} .content`);

		let height = 16 + (noFilter ? 0 : 42);
		if (!items.length) {
			height = isLoading ? height + 40 : 160;
		} else {
			height = items.reduce((res: number, current: any) => res + this.getRowHeight(current), height);
		};

		obj.css({ height });
		position();
	};
	
});

export default MenuSearchObject;

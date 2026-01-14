import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { MenuItemVertical, Filter, ObjectType, ObjectName, EmptySearch } from 'Component';
import { I, C, S, U, J, keyboard, Preview, analytics, Action, focus, translate } from 'Lib';

const LIMIT = 16;
const HEIGHT_SECTION = 28;
const HEIGHT_ITEM_SMALL = 28;
const HEIGHT_ITEM_BIG = 56;
const HEIGHT_DIV = 16;

const MenuSearchObject = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, onKeyDown, setActive, getId, position } = props;
	const { data, menuKey } = param;
	const { 
		filter, value, placeholder, label, noFilter, noIcon, onMore, withPlural, canAdd, addParam,
		isBig, noInfiniteLoading, type, dataMapper, dataSort, dataChange, skipIds, keys, limit,
	} = data;

	const [ isLoading, setIsLoading ] = useState(false);
	const [ dummy, setDummy ] = useState(0);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_ITEM_SMALL }));
	const filterRef = useRef(null);
	const listRef = useRef(null);
	const timeout = useRef(0);
	const itemsRef = useRef([]);
	const n = useRef(0);
	const offset = useRef(0);
	const cn = [ 'wrap' ];
	const placeholderFocus = data.placeholderFocus || translate('commonFilterObjects');

	if (label) {
		cn.push('withLabel');
	};
	if (!noFilter) {
		cn.push('withFilter');
	};

	useEffect(() => {
		rebind();
		resize();
		load(true);

		return () => {
			window.clearTimeout(timeout.current);
		};
	}, []);

	useEffect(() => {
		resize();
		rebind();
	});

	useEffect(() => {
		n.current = 0;
		reload();
	}, [ menuKey, filter ]);
	
	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};
	
	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const getItems = () => {
		const length = itemsRef.current.length;
		const items = [].concat(itemsRef.current);
		const canWrite = U.Space.canMyParticipantWrite();
		
		if (label && length) {
			items.unshift({ isSection: true, name: label });
		};

		if (canAdd && canWrite) {
			let name = '';
			let icon = 'plus';
			let arrow = false;

			if (addParam) {
				if (addParam.nameWithFilter && filter) {
					name = U.String.sprintf(addParam.nameWithFilter, filter);
				} else 
				if (addParam.name) {
					name = addParam.name;
				};
				if (addParam.icon) {
					icon = addParam.icon;
				};
				if (addParam.arrow) {
					arrow = true;
				};
			};

			if (!name) {
				name = filter ? U.String.sprintf(translate('commonCreateObjectWithName'), filter) : translate('commonCreateObject');
			};

			if (name) {
				if (length) {
					items.unshift({ isDiv: true });
				};

				items.unshift({ id: 'add', icon, name, arrow, isAdd: true });
			};
		};

		return items;
	};

	const loadMoreRows = ({ startIndex, stopIndex }) => {
		if (noInfiniteLoading) {
			return Promise.resolve();
		};

		return new Promise((resolve, reject) => {
			offset.current += J.Constant.limit.menuRecords;
			load(false, resolve);
		});
	};

	const reload = () => {
		n.current = 0;
		offset.current = 0;
		load(true);
	};
	
	const load = (clear: boolean, callBack?: (message: any) => void) => {
		if (isLoading) {
			return;
		};

		const filter = String(data.filter || '');
		const spaceId = data.spaceId || S.Common.space;
		
		const filters: any[] = [
			{ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() },
		].concat(data.filters || []);

		let sorts = [].concat(data.sorts || []);

		if (!sorts.length) {
			sorts = sorts.concat([
				{ relationKey: 'lastOpenedDate', type: I.SortType.Desc },
				{ relationKey: 'lastModifiedDate', type: I.SortType.Desc },
				{ relationKey: 'type', type: I.SortType.Asc }
			]);
		};

		if (skipIds && skipIds.length) {
			filters.push({ relationKey: 'id', condition: I.FilterCondition.NotIn, value: skipIds });
		};
		if ([ I.NavigationType.Move, I.NavigationType.LinkTo ].includes(type)) {
			filters.push({ relationKey: 'isReadonly', condition: I.FilterCondition.Equal, value: false });
		};
		if ([ I.NavigationType.Move, I.NavigationType.LinkTo, I.NavigationType.Link ].includes(type)) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.getSystemLayouts().filter(it => !U.Object.isTypeLayout(it)) });
			filters.push({ relationKey: 'type.uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template ] });
			filters.push({ relationKey: 'uniqueKey', condition: I.FilterCondition.NotIn, value: [ J.Constant.typeKey.template, J.Constant.typeKey.type ] });
		};

		if (clear) {
			setIsLoading(true);
		};

		U.Subscription.search({
			spaceId,
			filters,
			sorts,
			keys: keys || J.Relation.default,
			fullText: filter,
			offset: offset.current,
			limit: limit || J.Constant.limit.menuRecords,
		}, (message: any) => {
			setIsLoading(false);

			if (message.error.code) {
				return;
			};

			callBack?.(message);

			if (clear) {
				itemsRef.current = [];
			};

			itemsRef.current = itemsRef.current.concat(message.records || []);

			if (clear && dataChange) {
				itemsRef.current = dataChange(this, itemsRef.current);
			};

			if (dataMapper) {
				itemsRef.current = itemsRef.current.map(dataMapper);
			};

			if (dataSort) {
				itemsRef.current.sort(dataSort);
			};

			setDummy(dummy + 1);
		});
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			props.setActive(item, false);
			onOver(e, item);
		};
	};

	const onOver = (e: any, item: any) => {
		props.param.data.onOver?.(e, this, item);
	};
	
	const onClick = (e: any, item: any) => {
		e.stopPropagation();

		const { param, close } = props;
		const { data } = param;
		const { filter, rootId, type, blockId, blockIds, position, onSelect, noClose, route } = data;
		const addParam: any = data.addParam || {};
		const object = S.Detail.get(rootId, blockId);

		let details = data.details || {};

		if (!noClose) {
			close();
		};

		const process = (target: any, isNew: boolean) => {
			onSelect?.(target, isNew);

			if (!type) {
				return;
			};

			switch (type) {
				case I.NavigationType.Go:
					U.Object.openEvent(e, target);
					break;

				case I.NavigationType.Move:
					Action.move(rootId, target.id, '', blockIds, I.BlockPosition.Bottom);
					break;

				case I.NavigationType.Link:
					C.BlockCreate(rootId, blockId, position, U.Data.getLinkBlockParam(target.id, item.layout, true), (message: any) => {
						if (message.error.code) {
							return;
						};

						focus.set(message.blockId, { from: 0, to: 0 });
						focus.apply();

						analytics.event('CreateLink');
					});
					break;

				case I.NavigationType.LinkTo:
					const isCollection = U.Object.isCollectionLayout(target.layout);
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
						C.BlockCreate(target.id, '', position, U.Data.getLinkBlockParam(blockId, object.layout, true), cb);
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
				const flags = [ I.ObjectFlag.SelectTemplate ];

				U.Object.create('', '', details, I.BlockPosition.Bottom, '', flags, route || analytics.route.search, (message: any) => {
					process(message.details, true);
					close();
				});
			};
		} else {
			process(item, false);
		};
	};

	const onFilterKeyDown = (e: any, v: string) => {
		const { param, close } = props;
		const { data } = param;
		const { onBackspaceClose } = data;

		if (onBackspaceClose && !v) {
			keyboard.shortcut('backspace', e, () => {
				close();
				onBackspaceClose();
			});
		};
	};

	const onFilterChange = (v: string) => {
		const { param } = props;
		const { data } = param;
		const { onFilterChange } = data;

		if (v != filter) {
			window.clearTimeout(timeout.current);
			timeout.current = window.setTimeout(() => {
				const filter = filterRef.current.getValue();

				data.filter = filter;

				if (onFilterChange) {
					onFilterChange(filter);
				};
			}, J.Constant.delay.keyboard);
		};
	};

	const getRowHeight = (item: any) => {
		if (!item) {
			return HEIGHT_ITEM_SMALL;
		};

		let h = HEIGHT_ITEM_SMALL;
		if ((isBig || item.isBig) && !item.isAdd)	 h = HEIGHT_ITEM_BIG;
		if (item.isSection)							 h = HEIGHT_SECTION;
		if (item.isDiv)								 h = HEIGHT_DIV;
		return h;
	};

	const resize = () => {
		const items = getItems().slice(0, LIMIT);
		const obj = $(`#${getId()} .content`);

		let height = 16 + (noFilter ? 0 : 40);
		if (!items.length) {
			height = 160;
		} else {
			height = items.reduce((res: number, current: any) => res + getRowHeight(current), height);
		};

		obj.css({ height });
		position();
	};

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];
		if (!item) {
			return null;
		};

		const checkbox = value && value.length && value.includes(item.id);
		const cn = [];
		const props = {
			...item,
			object: (item.isAdd || item.isSection || item.isSystem ? undefined : item),
			withPlural,
		};

		let name = item.name;
		if (item.isAdd) {
			cn.push('add');
			props.isAdd = true;
		} else {
			name = <ObjectName object={item} withPlural={withPlural} />;
		};

		if (item.isHidden) {
			cn.push('isHidden');
		};

		if (isBig && !item.isAdd) {
			props.withDescription = true;
			props.iconSize = 40;
		} else 
		if (item.type) {
			const type = S.Record.getTypeById(item.type);
			props.caption = <ObjectType object={type} />;
		};

		if (undefined !== item.caption) {
			props.caption = item.caption;
		};

		if (noIcon) {
			props.object = undefined;
		};

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				<MenuItemVertical
					{...props}
					index={param.index}
					name={name}
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
					onMore={onMore ? e => onMore(e, item) : undefined}
					style={param.style}
					checkbox={checkbox}
					className={cn.join(' ')}
				/>
			</CellMeasurer>
		);
	};

	const items = getItems();

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getListRef: () => listRef.current,
		getFilterRef: () => filterRef.current,
		onClick,
		onOver,
	}), []);

	return (
		<div className={cn.join(' ')}>
			{!noFilter ? (
				<Filter 
					ref={filterRef}
					className="outlined"
					placeholder={placeholder} 
					placeholderFocus={placeholderFocus} 
					value={filter}
					onChange={onFilterChange} 
					onKeyDown={onFilterKeyDown}
					focusOnMount={true}
				/>
			) : ''}

			{!items.length && !isLoading ? (
				<EmptySearch filter={filter} />
			) : ''}

			{items.length && !isLoading ? (
				<div className="items">
					<InfiniteLoader
						rowCount={items.length + 1}
						loadMoreRows={loadMoreRows}
						isRowLoaded={({ index }) => !!itemsRef.current[index]}
						threshold={LIMIT}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										ref={listRef}
										width={width}
										height={height}
										deferredMeasurmentCache={cache.current}
										rowCount={items.length}
										rowHeight={({ index }) => getRowHeight(items[index])}
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
	
}));

export default MenuSearchObject;
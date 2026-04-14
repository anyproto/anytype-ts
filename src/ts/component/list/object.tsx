import React, { forwardRef, useImperativeHandle, useEffect, useState, useRef, MouseEvent } from 'react';
import { AutoSizer, WindowScroller, List, InfiniteLoader } from 'react-virtualized';
import { IconObject, Pager, ObjectName, ObjectDescription, Cell, SelectionTarget, Icon, Checkbox } from 'Component';
import * as I from 'Interface';

interface Column {
	relationKey: string;
	name: string;
	className?: string;
	width?: string;
	isObject?: boolean;
	isCell?: boolean;
	withDescription?: boolean;
	mapper?: (value : any) => any;
};

interface Props {
	spaceId: string;
	subId: string;
	rootId: string;
	columns: Column[];
	sources?: string[];
	filters?: I.Filter[];
	relationKeys?: string[];
	route: string;
	selectable?: boolean;
	selectedIds?: string[];
	ignoreArchived?: boolean;
	skipLayoutFilter?: boolean;
	withDescription?: boolean;
	iconSize?: number;
	emptyText?: string;
	defaultSortId?: string;
	defaultSortType?: I.SortType;
	useInfiniteScroll?: boolean;
	isPopup?: boolean;
	rowHeight?: number;
	onSelect?: (id: string, e: MouseEvent) => void;
	onSelectAll?: () => void;
	onSort?: (id: string, type: I.SortType) => void;
	isAllSelected?: boolean;
};

interface ListObjectRefProps {
	getData: (page: number, callBack?: (message: any) => void) => void;
	reload: (callBack?: (message: any) => void) => void;
};

const PREFIX = 'listObject';

const ListObjectRow = ({ item, columnList, css, subId, rootId, onContext, selectable, isSelected, onSelect, iconSize }: any) => {
	const cn = [ 'row' ];
	const cnc = [ 'cell', 'cellCheck' ];

	if (U.Object.isTaskLayout(item.layout) && item.isDone) {
		cn.push('isDone');
	};
	if (item.isArchived) {
		cn.push('isArchived');
	};
	if (item.isDeleted) {
		cn.push('isDeleted');
	};
	if (item.isHidden) {
		cn.push('isHidden');
	};

	if (isSelected) {
		cnc.push('isChecked');
	};

	return (
		<SelectionTarget
			id={item.id}
			type={I.SelectType.Record}
			className={cn.join(' ')}
			onContextMenu={e => onContext(e, item.id)}
			style={css}
		>
			{selectable ? (
				<div className={cnc.join(' ')}>
					<Checkbox value={isSelected} onChange={e => onSelect(item.id, e)} />
				</div>
			) : ''}

			{columnList.map(column => {
				const cn = [ 'cell', `c-${column.relationKey}` ];
				const cnc = [ 'cellContent' ];
				const value = item[column.relationKey];

				if (column.className) {
					cnc.push(column.className);
				};

				let content = null;
				let onClick = null;

				if (column.isObject) {
					let object = null;

					if (column.relationKey == 'name') {
						object = item;

						cn.push('isName');
						cnc.push('isName');
					} else {
						object = S.Detail.get(subId, value, []);
					};

					if (!object._empty_) {
						onClick = e => U.Object.openEvent(e, object);

						const iconProps: any = {};
						if (iconSize && (column.relationKey == 'name')) {
							iconProps.size = iconSize;
						};

						if (column.withDescription) {
							content = (
								<div className="flex">
									<IconObject object={object} {...iconProps} />
									<div className="info">
										<ObjectName object={object} />
										<ObjectDescription object={object} />
									</div>
								</div>
							);
						} else {
							content = (
								<div className="flex">
									<IconObject object={object} {...iconProps} />
									<ObjectName object={object} />
								</div>
							);
						};
					};
				} else
				if (column.isCell) {
					content = (
						<Cell
							elementId={Relation.cellId(PREFIX, column.relationKey, item.id)}
							rootId={rootId}
							subId={subId}
							block={null}
							relationKey={column.relationKey}
							getRecord={() => item}
							viewType={I.ViewType.Grid}
							idPrefix={PREFIX}
							iconSize={20}
							readonly={true}
							arrayLimit={2}
							textLimit={150}
						/>
					);
				} else {
					content = column.mapper ? column.mapper(value) : value;
				};

				return (
					<div key={`cell-${column.relationKey}`} className={cn.join(' ')}>
						{content ? <div className={cnc.join(' ')} onClick={onClick} onAuxClick={onClick}>{content}</div> : ''}
					</div>
				);
			})}
		</SelectionTarget>
	);
};

const ListObject = forwardRef<ListObjectRefProps, Props>(({
	spaceId = '',
	subId = '',
	rootId = '',
	columns = [],
	sources = [],
	filters = [],
	relationKeys = [],
	route = '',
	selectable = false,
	selectedIds = [],
	ignoreArchived = true,
	skipLayoutFilter = false,
	withDescription = false,
	iconSize,
	emptyText = '',
	defaultSortId,
	defaultSortType,
	useInfiniteScroll = false,
	isPopup = false,
	rowHeight = 38,
	onSelect,
	onSelectAll,
	onSort: onSortCallback,
	isAllSelected = false,
}, ref) => {

	const { offset, total } = S.Record.getMeta(subId, '');
	const listRef = useRef(null);
	const { dateFormat } = S.Common;

	const getColumns = (): Column[] => {
		return ([ { relationKey: 'name', name: translate('commonName'), isObject: true, withDescription } ] as any[]).concat(columns || []);
	};

	const columnList = getColumns();
	const [ sortType, setSortType ] = useState(defaultSortType ?? I.SortType.Asc);
	const [ sortId, setSortId ] = useState(defaultSortId ?? (columnList.length ? columnList[0].relationKey : ''));

	const getKeys = () => {
		return J.Relation.default.concat(getColumns().map(it => it.relationKey)).concat(relationKeys || []);
	};

	const getItems = () => {
		return S.Record.getRecords(subId, getKeys());
	};

	const getFilters = () => {
		const fl = [];

		if (!skipLayoutFilter) {
			fl.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.NotIn, value: U.Object.excludeFromSet() });
		};

		fl.push(...(filters || []));
		return fl;
	};

	const getData = (page: number, callBack?: (message: any) => void) => {
		const limit = J.Constant.limit.listObject;
		const offset = (page - 1) * limit;

		S.Record.metaSet(subId, '', { offset });

		U.Subscription.subscribe({
			spaceId,
			subId,
			sorts: [ { relationKey: sortId, type: sortType } ],
			keys: getKeys(),
			sources,
			filters: getFilters(),
			offset,
			limit,
			ignoreArchived,
		}, callBack);
	};

	const getDataInfinite = (offset: number, callBack?: (message: any) => void) => {
		const limit = offset + J.Constant.limit.listObject;

		S.Record.metaSet(subId, '', { offset });

		U.Subscription.subscribe({
			spaceId,
			subId,
			sorts: [ { relationKey: sortId, type: sortType } ],
			keys: getKeys(),
			sources,
			filters: getFilters(),
			offset: 0,
			limit,
			ignoreArchived,
		}, callBack);
	};

	const loadMoreRows = () => {
		const { offset } = S.Record.getMeta(subId, '');
		const newOffset = offset + J.Constant.limit.listObject;

		return new Promise<void>((resolve) => {
			getDataInfinite(newOffset, () => resolve());
		});
	};

	const onContext = (e: any, id: string): void => {
		e.preventDefault();
		e.stopPropagation();

		const selection = S.Common.getRef('selectionProvider');

		let objectIds = selection?.get(I.SelectType.Record) || [];
		if (!objectIds.length) {
			objectIds = [ id ];
		};

		S.Menu.open('objectContext', {
			recalcRect: () => {
				const { x, y } = keyboard.mouse.page;
				return { width: 0, height: 0, x: x + 4, y: y };
			},
			data: {
				objectIds,
				subId,
				relationKeys: getKeys(),
				allowedLinkTo: true,
				allowedOpen: true,
				allowedNewTab: true,
				allowedCollection: true,
				allowedExport: true,
				allowedType: true,
			}
		});
	};

	const onSort = (relationKey: string): void => {
		let type = I.SortType.Asc;

		if (sortId == relationKey) {
			type = sortType == I.SortType.Asc ? I.SortType.Desc : I.SortType.Asc;
		};

		setSortId(relationKey);
		setSortType(type);

		if (onSortCallback) {
			onSortCallback(relationKey, type);
		};

		analytics.event('ObjectListSort', { relationKey, route, type });
	};

	const items = getItems();
	const widths = [ 'minmax(0, 1fr)' ];
	for (let i = 1; i < columnList.length; ++i) {
		widths.push(columnList[i].width || `${60 / (columnList.length - 1)}%`);
	};

	const css = { gridTemplateColumns: widths.join(' ') };

	let pager = null;
	if (!useInfiniteScroll && total && items.length) {
		pager = (
			<Pager
				offset={offset}
				limit={J.Constant.limit.listObject}
				total={total}
				onChange={page => getData(page)}
			/>
		);
	};

	useEffect(() => {
		return () => {
			U.Subscription.destroyList([ subId ]);
		};
	}, []);

	useEffect(() => {
		if (useInfiniteScroll) {
			getDataInfinite(0);
		} else {
			getData(1);
		};
	}, [ sortId, sortType, JSON.stringify(filters) ]);

	const reload = (callBack?: (message: any) => void) => {
		if (useInfiniteScroll) {
			getDataInfinite(0, callBack);
		} else {
			getData(1, callBack);
		};
	};

	useImperativeHandle(ref, () => ({
		getData,
		reload,
	}));

	const head = (
		<div className="row isHead" style={css}>
			{selectable ? (
				<div className={[ 'cell', 'cellCheck', (isAllSelected ? 'isChecked' : '') ].join(' ')}>
					<Checkbox value={isAllSelected} onChange={() => onSelectAll?.()} />
				</div>
			) : ''}
			{columnList.map(column => {
				const cn = [ 'cell', 'isHead' ];
				const arrow = sortId == column.relationKey ? <Icon name="common/sortArrow" className={`sortArrow c${sortType}`} /> : null;

				if (arrow) {
					cn.push('isSorted');
				};

				return (
					<div
						key={`head-${column.relationKey}`}
						className={cn.join(' ')}
						onClick={() => onSort(column.relationKey)}
					>
						<div className="name">{column.name}{arrow}</div>
					</div>
				);
			})}
		</div>
	);

	let body = null;

	if (!items.length) {
		body = (
			<div className="row">
				<div className="cell empty">{emptyText || translate('commonNoObjects')}</div>
			</div>
		);
	} else
	if (useInfiniteScroll) {
		const scrollContainer = U.Dom.getScrollContainer(isPopup);

		body = (
			<InfiniteLoader
				isRowLoaded={({ index }) => !!items[index]}
				loadMoreRows={loadMoreRows}
				rowCount={total}
				threshold={10}
			>
				{({ onRowsRendered }) => (
					<WindowScroller scrollElement={scrollContainer}>
						{({ height, isScrolling, scrollTop }) => (
							<AutoSizer disableHeight={true}>
								{({ width }) => (
									<List
										ref={listRef}
										autoHeight={true}
										height={Number(height) || 0}
										width={Number(width) || 0}
										isScrolling={isScrolling}
										rowCount={items.length}
										rowHeight={rowHeight}
										onRowsRendered={onRowsRendered}
										overscanRowCount={10}
										scrollTop={scrollTop}
										rowRenderer={({ key, index, style }) => (
											<div key={key} style={{ ...style, overflow: 'visible' }}>
												<ListObjectRow
													item={items[index]}
													columnList={columnList}
													css={css}
													subId={subId}
													rootId={rootId}
													onContext={onContext}
													selectable={selectable}
													isSelected={selectedIds.includes(items[index].id)}
													onSelect={onSelect}
													iconSize={iconSize}
												/>
											</div>
										)}
									/>
								)}
							</AutoSizer>
						)}
					</WindowScroller>
				)}
			</InfiniteLoader>
		);
	} else {
		body = items.map((item: any) => (
			<ListObjectRow
				key={item.id}
				item={item}
				columnList={columnList}
				css={css}
				subId={subId}
				rootId={rootId}
				onContext={onContext}
				selectable={selectable}
				isSelected={selectedIds.includes(item.id)}
				onSelect={onSelect}
				iconSize={iconSize}
			/>
		));
	};

	return (
		<div className="listObject">
			<div className="table">
				{head}
				{body}
			</div>

			{pager}
		</div>
	);

});

export default ListObject;

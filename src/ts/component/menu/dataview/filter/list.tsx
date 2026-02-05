import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { I, C, S, U, Relation, keyboard, translate, analytics, Dataview } from 'Lib';
import { MenuItemVertical } from 'Component';

const HEIGHT_ITEM = 28;
const HEIGHT_DIV = 16;
const LIMIT = 20;

const MenuFilterList = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, position, onKeyDown, setActive } = props;
	const { data } = param;
	const { rootId, blockId, getView, loadData, isInline, getTarget, readonly, closeFilters } = data;
	const nodeRef = useRef(null);
	const n = useRef(-1);
	const cache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: HEIGHT_ITEM }));
	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);

	useEffect(() => {
		rebind();

		return () => {
			unbind();
		};
	}, []);

	useEffect(() => {
		resize();
		setActive();
	});

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const isAdvancedFilter = (filter: I.Filter): boolean => {
		return !![ I.FilterOperator.And, I.FilterOperator.Or ].includes(filter.operator);
	};

	const getFilterItems = () => {
		const view = getView();

		if (!view) {
			return [];
		};

		return U.Common.objectCopy(view.filters).map((it: any) => {
			return {
				...it,
				relation: S.Record.getRelationByKey(it.relationKey),
			};
		}).filter(it => it.relation || isAdvancedFilter(it)).sort((a, b) => {
			const aAdvanced = isAdvancedFilter(a);
			const bAdvanced = isAdvancedFilter(b);

			if (aAdvanced !== bAdvanced) {
				return aAdvanced ? -1 : 1;
			};

			const aActive = Relation.isFilterActive(a);
			const bActive = Relation.isFilterActive(b);

			if (aActive === bActive) return 0;
			return aActive ? -1 : 1;
		});
	};

	const getItems = () => {
		const filterItems = getFilterItems();
		const items: any[] = [ ...filterItems ];

		if (!isReadonly) {
			items.push({ isDiv: true });
			items.push({ id: 'add', name: translate('menuDataviewFilterNewFilter'), icon: 'plus' });

			if (filterItems.length) {
				items.push({ id: 'clear', name: translate('commonClear'), icon: 'remove' });
			};
		};

		return items;
	};

	const getRowHeight = (item: any) => {
		if (item.isDiv) return HEIGHT_DIV;
		return HEIGHT_ITEM;
	};

	const getCaption = (item: any): string => {
		if (isAdvancedFilter(item)) {
			return '';
		};

		const { relation, condition } = item;

		if (!relation) {
			return '';
		};

		const conditionOptions = Relation.filterConditionsByType(relation.format);
		const conditionOption: any = conditionOptions.find(it => it.id == condition) || {};

		return conditionOption.name || '';
	};

	const getName = (item: any): string => {
		if (isAdvancedFilter(item)) {
			const ruleCount = item.nestedFilters?.length || 1;
			return `${ruleCount} ${U.Common.plural(ruleCount, translate('pluralRule'))}`;
		};

		return item.relation?.name || '';
	};

	const onClick = (e: any, item: any) => {
		if (item.id == 'add') {
			onAdd();
			return;
		};

		if (item.id == 'clear') {
			onClear();
			return;
		};

		if (isAdvancedFilter(item)) {
			S.Menu.open('dataviewFilterAdvanced', {
				element: `#${getId()} #item-${item.id}`,
				classNameWrap: 'fromBlock',
				horizontal: I.MenuDirection.Right,
				offsetY: 4,
				noFlipY: true,
				data: {
					rootId,
					blockId,
					isInline,
					getView,
					getTarget,
					readonly: isReadonly,
					loadData,
				}
			});
			return;
		};

		const view = getView();
		const filter: I.Filter = view.getFilter(item.id);

		S.Menu.open('dataviewFilterValues', {
			element: `#${getId()} #item-${item.id}`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
			noFlipY: true,
			data: {
				rootId,
				blockId,
				isInline,
				getView,
				getTarget,
				readonly: isReadonly,
				save: () => {
					C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, filter, () => {
						loadData(view.id, 0, false);
					});
				},
				itemId: item.id,
			}
		});
	};

	const onRemoveFilter = (item: any) => {
		const view = getView();
		const object = getTarget();

		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ item.id ], () => {
			loadData(view.id, 0, false);
		});

		analytics.event('RemoveFilter', {
			objectType: object.type,
			embedType: analytics.embedType(isInline)
		});
	};

	const onClearFilter = (item: any) => {
		const view = getView();
		const filter = view.getFilter(item.id);
		const relation = S.Record.getRelationByKey(filter.relationKey);

		if (!relation) {
			return;
		};

		const updatedFilter = {
			...filter,
			...Dataview.getDefaultFilterValues(relation),
		};

		C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, updatedFilter, () => {
			loadData(view.id, 0, false);
		});
	};

	const onMore = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		S.Menu.open('select', {
			element: `#${getId()} #item-${item.id} .icon.more`,
			classNameWrap: 'fromBlock',
			offsetY: 4,
			data: {
				options: [
					{ id: 'clear', name: translate('commonClear') },
					{ id: 'delete', name: translate('commonDelete') },
				],
				onSelect: (e: any, option: any) => {
					switch (option.id) {
						case 'clear': onClearFilter(item); break;
						case 'delete': onRemoveFilter(item); break;
					};
				},
			}
		});
	};

	const onClear = () => {
		const view = getView();
		const filterItems = getFilterItems();

		C.BlockDataviewFilterRemove(rootId, blockId, view.id, filterItems.map(it => it.id), () => {
			loadData(view.id, 0, false);
			closeFilters?.();
		});
	};

	const onAdd = () => {
		const view = getView();
		const object = getTarget();

		U.Menu.sortOrFilterRelationSelect({
			element: `#${getId()} #item-add`,
			classNameWrap: 'fromBlock',
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
		}, {
			rootId,
			blockId,
			getView,
			onSelect: (item: any) => {
				const filterValues = Dataview.getDefaultFilterValues(item);

				C.BlockDataviewFilterAdd(rootId, blockId, view.id, {
					relationKey: item.relationKey || item.id,
					...filterValues,
				}, () => {
					loadData(view.id, 0, false);

					analytics.event('AddFilter', {
						condition: filterValues.condition,
						objectType: object.type,
						embedType: analytics.embedType(isInline),
					});
				});
			},
			onAdvancedFilterAdd: () => {
				C.BlockDataviewFilterAdd(rootId, blockId, view.id, {
					operator: I.FilterOperator.And,
					condition: I.FilterCondition.None,
					relationKey: '',
					value: '',
					nestedFilters: [
						{
							relationKey: 'name',
							condition: I.FilterCondition.In,
							value: '',
						}
					],
				}, () => {
					loadData(view.id, 0, false);

					analytics.event('AddFilter', {
						condition: I.FilterCondition.None,
						objectType: object.type,
						embedType: analytics.embedType(isInline),
					});
				});
			},
		});
	};

	const onMouseEnter = (e: any, item: any) => {
		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};
	};

	const rowRenderer = (param: any) => {
		const item: any = items[param.index];

		if (!item) {
			return null;
		};

		let content = null;

		if (item.isDiv) {
			content = (
				<div className="separator" style={param.style}>
					<div className="inner" />
				</div>
			);
		} else
		if ([ 'add', 'clear' ].includes(item.id)) {
			content = (
				<MenuItemVertical
					id={item.id}
					icon={item.icon}
					name={item.name}
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
					style={param.style}
				/>
			);
		} else {
			const isAdvanced = isAdvancedFilter(item);

			content = (
				<MenuItemVertical
					id={item.id}
					icon={isAdvanced ? 'advancedFilter' : undefined}
					object={!isAdvanced && item.relation ? { relationFormat: item.relation.format, layout: I.ObjectLayout.Relation, name: item.relation.name } : undefined}
					name={isAdvanced ? getName(item) : undefined}
					caption={getCaption(item)}
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
					withMore={!isReadonly}
					onMore={e => onMore(e, item)}
					style={param.style}
				/>
			);
		};

		return (
			<CellMeasurer
				key={param.key}
				parent={param.parent}
				cache={cache.current}
				columnIndex={0}
				rowIndex={param.index}
			>
				{content}
			</CellMeasurer>
		);
	};

	const resize = () => {
		const obj = $(`#${getId()} .content`);
		const items = getItems();
		const itemsHeight = items.reduce((res: number, current: any) => res + getRowHeight(current), 0);
		const height = Math.max(HEIGHT_ITEM + 24, Math.min(400, itemsHeight + 24));

		obj.css({ height });
		position();
	};

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
	}), []);

	const items = getItems();

	return (
		<div ref={nodeRef} className="wrap">
			{items.length ? (
				<div className="items">
					<InfiniteLoader
						rowCount={items.length}
						loadMoreRows={() => {}}
						isRowLoaded={() => true}
						threshold={LIMIT}
					>
						{({ onRowsRendered }) => (
							<AutoSizer className="scrollArea">
								{({ width, height }) => (
									<List
										width={width}
										height={height}
										deferredMeasurementCache={cache.current}
										rowCount={items.length}
										rowHeight={({ index }) => getRowHeight(items[index])}
										rowRenderer={rowRenderer}
										onRowsRendered={onRowsRendered}
										overscanRowCount={LIMIT}
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

export default MenuFilterList;

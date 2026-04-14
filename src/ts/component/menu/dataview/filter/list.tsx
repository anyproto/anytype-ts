import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { AutoSizer, CellMeasurer, InfiniteLoader, List, CellMeasurerCache } from 'react-virtualized';
import { MenuItemVertical, Icon, Label } from 'Component';
import * as I from 'Interface';

const HEIGHT_ITEM = 28;
const HEIGHT_FILTER = 32;
const HEIGHT_DIV = 16;
const LIMIT = 20;

const MenuFilterList = forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, getId, onKeyDown, setActive, position } = props;
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
		position();
		setActive();
	});

	const rebind = () => {
		unbind();
		U.Dom.addEvent(window, 'keydown', onKeyDown);
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		U.Dom.removeEvent(window, 'keydown', onKeyDown);
	};

	const getFilterItems = () => {
		const view = getView();
		if (!view) {
			return [];
		};

		const filters = Dataview.getFilteredFilters(view.filters);
		
		return U.Common.objectCopy(filters).map((it: any) => {
			return {
				...it,
				relation: S.Record.getRelationByKey(it.relationKey),
				isFilter: true,
			};
		}).sort((a, b) => {
			const aAdvanced = Dataview.isAdvancedFilter(a);
			const bAdvanced = Dataview.isAdvancedFilter(b);

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
			items.push({ id: 'add', name: translate('menuDataviewFilterNewFilter'), iconParam: { name: 'plus/menu' } });

			if (filterItems.length) {
				items.push({ id: 'clear', name: translate('commonClear'), iconParam: { name: 'menu/action/remove' } });
			};
		};

		return items;
	};

	const getRowHeight = (item: any) => {
		if (item.isDiv) return HEIGHT_DIV;
		if (item.isFilter) return HEIGHT_FILTER;
		return HEIGHT_ITEM;
	};

	const getCaption = (item: any): string => {
		if (Dataview.isAdvancedFilter(item)) {
			return '';
		};

		const { relation, condition } = item;

		if (!relation) {
			return '';
		};

		const conditionOptions = Relation.filterConditionsByType(relation.format, item.value);
		const conditionOption: any = conditionOptions.find(it => it.id == condition) || {};

		return conditionOption.name || '';
	};

	const getName = (item: any): string => {
		if (Dataview.isAdvancedFilter(item)) {
			const ruleCount = item.nestedFilters?.length || 1;
			return U.String.sprintf(translate('commonCountRules'), ruleCount, U.Common.plural(ruleCount, translate('pluralRule')));
		};

		return item.relation?.name || '';
	};

	const getValueText = (item: any): string => {
		const { relation, condition, quickOption, value } = item;

		if (!relation) return '';
		if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(condition)) {
			return '';
		};

		switch (relation.format) {
			case I.RelationType.Date: {
				const filterOptions = Relation.filterQuickOptions(relation.format, condition);
				const filterOption: any = filterOptions.find(it => it.id == quickOption) || {};

				if (quickOption == I.FilterQuickOption.ExactDate) {
					return value !== null ? U.Date.dateWithFormat(S.Common.dateFormat, value) : '';
				} else
				if ([ I.FilterQuickOption.NumberOfDaysAgo, I.FilterQuickOption.NumberOfDaysNow ].includes(quickOption)) {
					const v = Number(value) || 0;
					const key = quickOption == I.FilterQuickOption.NumberOfDaysAgo ? 'menuItemFilterTimeAgo' : 'menuItemFilterTimeFromNow';
					return U.String.sprintf(translate(key), v, U.Common.plural(v, translate('pluralDay')));
				} else
				if (filterOption) {
					return String(filterOption.name || '').toLowerCase();
				};
				return '';
			};
			case I.RelationType.Checkbox:
				return translate(`relationCheckboxLabelShort${Number(value)}`);
			case I.RelationType.MultiSelect:
			case I.RelationType.Select: {
				const list = Relation.getOptions(value);
				return list.length ? list.map(it => it.name).join(', ') : 'empty';
			};
			case I.RelationType.File:
			case I.RelationType.Object: {
				const subId = S.Record.getSubId(rootId, blockId);
				const list = Relation.getArrayValue(value)
					.map(it => S.Detail.get(subId, it, []))
					.filter(it => !it._empty_);
				return list.map(it => it.name).join(', ');
			};
			case I.RelationType.Number:
				return String(Number(value) || 0);
			default:
				return `"${value}"`;
		};
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

		if (Dataview.isAdvancedFilter(item)) {
			unbind();
			S.Menu.open('dataviewFilterAdvanced', {
				element: `#${getId()} #item-${U.Common.esc(item.id)}`,
				classNameWrap: 'fromBlock',
				horizontal: I.MenuDirection.Right,
				offsetY: 4,
				noFlipY: true,
				rebind,
				parentId: props.id,
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

		unbind();
		S.Menu.open('dataviewFilterValues', {
			element: `#${getId()} #item-${U.Common.esc(item.id)}`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
			noFlipY: true,
			rebind,
			parentId: props.id,
			data: {
				rootId,
				blockId,
				isInline,
				getView,
				getTarget,
				readonly: isReadonly,
				save: () => {
					const currentFilter = view.getFilter(item.id);
					if (currentFilter) {
						C.BlockDataviewFilterReplace(rootId, blockId, view.id, item.id, currentFilter, () => {
							loadData(view.id, 0, false);
						});
					};
				},
				itemId: item.id,
			}
		});
	};

	const onRemoveFilter = (item: any) => {
		const view = getView();
		const object = getTarget();
		const rel = S.Record.getRelationByKey(item.relationKey);

		C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ item.id ], () => {
			loadData(view.id, 0, false);
		});

		analytics.event('RemoveFilter', {
			objectType: object.type,
			relationKey: item.relationKey,
			format: rel?.format,
			embedType: analytics.embedType(isInline)
		});
	};

	const onClearFilter = (item: any) => {
		const view = getView();
		const filter = view.getFilter(item.id);

		Dataview.clearFilter(rootId, blockId, view.id, filter, () => {
			loadData(view.id, 0, false);
		});
	};

	const onMore = (e: any, item: any) => {
		e.preventDefault();
		e.stopPropagation();

		unbind();
		S.Menu.open('select', {
			element: `#${getId()} #item-${U.Common.esc(item.id)} .icon.more`,
			classNameWrap: 'fromBlock',
			horizontal: I.MenuDirection.Right,
			offsetY: 4,
			rebind,
			parentId: props.id,
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

	const createFilter = (filter: any) => {
		const view = getView();
		const object = getTarget();

		Dataview.addFilter(rootId, blockId, view.id, filter, (message: any) => {
			loadData(view.id, 0, false);

			analytics.event('AddFilter', {
				condition: filter.condition,
				objectType: object.type,
				embedType: analytics.embedType(isInline),
			});

			if (message.filterId) {
				window.setTimeout(() => onClick(null, { ...filter, id: message.filterId }), J.Constant.delay.menu);
			};
		});
	};

	const onAdd = () => {
		unbind();
		U.Menu.sortOrFilterRelationSelect({
			element: `#${getId()} #item-add`,
			classNameWrap: 'fromBlock',
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			offsetY: 4,
			rebind,
			parentId: props.id,
		}, {
			rootId,
			blockId,
			getView,
			onSelect: (item: any) => {
				createFilter({
					relationKey: item.relationKey || item.id,
					...Dataview.getDefaultFilterValues(item),
				});
			},
			onAdvancedFilterAdd: () => {
				createFilter(Dataview.getDefaultAdvancedFilter());
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
					iconParam={item.iconParam}
					name={item.name}
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
					style={param.style}
				/>
			);
		} else {
			const isAdvanced = Dataview.isAdvancedFilter(item);
			const cn = [ 'item', 'filterItem' ];

			if (isAdvanced) {
				cn.push('isAdvanced');
			};
			if (isReadonly) {
				cn.push('isReadonly');
			};
			if (Relation.isFilterActive(item)) {
				cn.push('isActive');
			};

			content = (
				<div
					id={`item-${item.id}`}
					className={cn.join(' ')}
					onMouseEnter={e => onMouseEnter(e, item)}
					onClick={e => onClick(e, item)}
					style={param.style}
				>
					<div className="filterInner">
						{isAdvanced ? (
							<>
								<Icon name="control/dataview/advanced" className="filterIcon advanced" />
								<div className="filterContent">
									<Label className="relationName" text={getName(item)} />
								</div>
							</>
						) : (
							<>
								<Icon name={Relation.registryName(item.relation.relationKey, item.relation.format)} />
								<div className="filterContent">
									<Label className="relationName" text={item.relation.name} />
									{Relation.isFilterActive(item) ? (
										<>
											<Label className="condition" text={getCaption(item)} />
											<div className="value">{getValueText(item)}</div>
										</>
									) : ''}
								</div>
							</>
						)}
					</div>
					{!isReadonly ? <Icon name="common/more" className="more" onClick={e => onMore(e, item)} /> : ''}
				</div>
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

	const beforePosition = () => {
		const obj = U.Dom.select('.content', U.Dom.get(getId()));
		const items = getItems();
		const itemsHeight = items.reduce((res: number, current: any) => res + getRowHeight(current), 0);
		const height = Math.max(HEIGHT_ITEM + 16, Math.min(400, itemsHeight + 16));

		U.Dom.css(obj, { height: `${height}px` });
	};

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		onClick,
		beforePosition,
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

});

export default MenuFilterList;

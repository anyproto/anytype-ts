import React, { forwardRef, useRef, useEffect, useImperativeHandle, useState, MouseEvent } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { I, S, U, J, C, translate, analytics, Relation, Dataview } from 'Lib';
import { Select, Icon, Input, MenuItemVertical, Label, OptionSelect, CalendarSelect, TabSwitch } from 'Component';

const SUB_ID_PREFIX = 'filterOptionList';

const MenuDataviewFilterValues = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { config } = S.Common;
	const { param, setHover, close, onKeyDown, setActive, getId, getSize, position } = props;
	const { data, className, classNameWrap } = param;
	const { rootId, blockId, getView, itemId, readonly, save, isInline, getTarget, filter: filterProp, hideHead, onFilterPropChange } = data;
	const nodeRef = useRef(null);
	const selectRef = useRef(null);
	const conditionRef = useRef(null);
	const inputRef = useRef(null);
	const optionSelectRef = useRef(null);
	const range = useRef(null);
	const n = useRef(-1);
	const timeout = useRef(0);
	const [ dummy, setDummy ] = useState(0);

	const view = getView();
	const item = filterProp || view?.getFilter(itemId);
	const relation: any = item ? S.Record.getRelationByKey(item.relationKey) : null;
	const isInlineRelation = relation && [ I.RelationType.Select, I.RelationType.MultiSelect, I.RelationType.Object, I.RelationType.File ].includes(relation.format);

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems: () => isInlineRelation ? optionSelectRef.current?.getItems() || [] : [],
		getIndex: () => isInlineRelation ? optionSelectRef.current?.getIndex() ?? -1 : n.current,
		setIndex: (i: number) => isInlineRelation ? optionSelectRef.current?.setIndex(i) : n.current = i,
		getFilterRef: () => isInlineRelation ? optionSelectRef.current?.getFilterRef() : inputRef.current,
		getListRef: () => optionSelectRef.current?.getListRef(),
		onOver: (e: any, item: any) => optionSelectRef.current?.onOver(e, item),
		onClick: (e: any, item: any) => optionSelectRef.current?.onClick(e, item),
	}), [ isInlineRelation ]);

	useEffect(() => {
		init();
		rebind();

		return () => {
			unbind();
			S.Menu.closeAll(J.Menu.cell);
			window.clearTimeout(timeout.current);
		};
	}, []);

	useEffect(() => {
		const view = getView();
		if (!view) {
			return;
		};

		init();

		const it = filterProp || view.getFilter(itemId);
		if (!it) {
			return;
		};

		const rel = S.Record.getRelationByKey(it.relationKey);

		if (!rel || !inputRef.current) {
			return;
		};

		const isDate = Relation.isDate(rel.format);
		const withFilter = [ I.RelationType.Select, I.RelationType.MultiSelect ].includes(rel.format);

		if (inputRef.current.setValue && !withFilter) {
			if (isDate) {
				// NumberOfDaysAgo/NumberOfDaysNow use input, ExactDate uses CalendarSelect
				if (it.quickOption != I.FilterQuickOption.ExactDate) {
					inputRef.current.setValue(it.value);
				};
			} else {
				inputRef.current.setValue(it.value);
			};
		};

		if (range.current && !isDate && !withFilter) {
			inputRef.current?.setRange?.(range.current);
		};
	});

	const rebind = () => {
		unbind();
		$(window).on('keydown.menu', e => onKeyDown(e));
		window.setTimeout(() => setActive(), 15);
	};

	const unbind = () => {
		$(window).off('keydown.menu');
	};

	const init = () => {
		const view = getView();
		if (!view) {
			return;
		};

		const it = filterProp || view.getFilter(itemId);
		if (it) {
			checkClear(it.value);
		};
	};

	const getQuickOptions = () => {
		if (hideHead) {
			return [];
		};

		const view = getView();
		if (!view) {
			return [];
		};

		const item = view.getFilter(itemId);
		if (!item) {
			return [];
		};

		const relation: any = S.Record.getRelationByKey(item.relationKey) || {};
		const options = Relation.filterQuickOptions(relation.format, item.condition);

		if (relation.format == I.RelationType.Date) {
			return options.filter(it => it.id != I.FilterQuickOption.ExactDate);
		};

		return options;
	};

	const onChange = (k: string, v: any, withTimeout?: boolean) => {
		if (filterProp && onFilterPropChange) {
			const formatted = (k == 'value') ? Relation.formatValue(relation, v, false) : v;

			onFilterPropChange(k, formatted);
			S.Menu.updateData(props.id, { filter: { ...filterProp, value: v } });
			setDummy(dummy + 1);
			return;
		};

		const view = getView();
		const object = getTarget();

		if (!view) {
			return;
		};

		let item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		const rel = S.Record.getRelationByKey(item.relationKey);
		if (!rel) {
			return;
		};

		checkClear(v);

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			item = U.Common.objectCopy(item);
			item[k] = v;

			if (k == 'condition') {
				if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(v)) {
					item.value = Relation.formatValue(rel, null, false);
				};

				const quickOptions = Relation.filterQuickOptions(rel.format, item.condition);
				const filterOption = quickOptions.find(it => it.id == item.quickOption);

				if (!filterOption) {
					item.quickOption = quickOptions.length ? quickOptions[0].id : I.FilterQuickOption.ExactDate;
				};
			};

			if (k == 'quickOption') {
				item.value = Relation.formatValue(rel, null, false);
				item[k] = Number(v);
			};

			if (k == 'value') {
				item[k] = Relation.formatValue(rel, item[k], false);
			};

			view.setFilter(item);

			analytics.event('ChangeFilterValue', {
				condition: item.condition,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});

			save();
			setDummy(dummy + 1);
		}, withTimeout ? 300 : 0);
	};

	const onSubmitHandler = (e: any) => {
		e.preventDefault();

		getView().setFilter({ id: itemId, value: inputRef.current.getValue() });
		close();
	};

	const onFocusText = () => {
		S.Menu.close('select');
	};

	const onSelect = (e: any) => {
		range.current = {
			from: e.currentTarget.selectionStart,
			to: e.currentTarget.selectionEnd,
		};
	};

	const getRelationOptions = () => {
		return Relation.getFilterOptions(rootId, blockId, getView());
	};

	const getSubId = () => {
		return `${SUB_ID_PREFIX}-${itemId}`;
	};

	const checkClear = (v: any) => {
		$(nodeRef.current).find('.icon.clear').toggleClass('active', !!v);
	};

	const onClear = (e: any) => {
		e.stopPropagation();

		range.current = null;
		onChange('value', null);
	};

	const onValueHover = (e: MouseEvent) => {
		e.persist();

		S.Menu.closeAll([ 'select' ], () => {
			selectRef.current?.show(e);
			window.setTimeout(() => setHover({ id: 'value' }), 35);
		});
	};

	const onSelectClose = () => {
		setHover();
	};

	const onConditionClick = (e: MouseEvent) => {
		e.stopPropagation();

		if (S.Menu.isOpen('select')) {
			S.Menu.close('select');
		} else {
			conditionRef.current?.show(e);
		};
	};

	const onMore = (e: MouseEvent) => {
		e.stopPropagation();

		const view = getView();
		if (!view) {
			return;
		};

		const item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		const relation = S.Record.getRelationByKey(item.relationKey);
		if (!relation) {
			return;
		};

		S.Menu.open('select', {
			element: `#${getId()} .icon.more`,
			classNameWrap,
			offsetY: 4,
			horizontal: I.MenuDirection.Right,
			data: {
				options: [
					{ id: 'clear', name: translate('commonClear') },
					{ id: 'delete', name: translate('commonDelete') },
				],
				onSelect: (e: any, option: any) => {
					switch (option.id) {
						case 'clear': {
							const filter = {
								...U.Common.objectCopy(item),
								...Dataview.getDefaultFilterValues(relation),
							};

							view.setFilter(filter);
							save();
							setDummy(dummy + 1);
							break;
						};

						case 'delete': {
							C.BlockDataviewFilterRemove(rootId, blockId, view.id, [ itemId ]);
							close();
							break;
						};
					};
				},
			}
		});
	};

	if (!view || !item || !relation) {
		return null;
	};

	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
	const relationOptions = getRelationOptions();
	const conditionOptions = Relation.filterConditionsByType(relation.format);
	const checkboxOptions: I.Option[] = [
		{ id: '1', name: translate('menuDataviewFilterValuesChecked') },
		{ id: '0', name: translate('menuDataviewFilterValuesUnchecked') },
	];
	const relationOption: any = relationOptions.find(it => it.id == item.relationKey) || {};
	const items = getQuickOptions();
	const selectParam = {
		width: 260,
		isSub: true,
		noScroll: true,
		noVirtualisation: true,
		passThrough: false,
		onClose: onSelectClose,
		className,
		classNameWrap,
		rebind,
	};

	const hasExactDate = relation.format == I.RelationType.Date &&
		Relation.filterQuickOptions(relation.format, item.condition)
			.some(it => it.id == I.FilterQuickOption.ExactDate);
	const isExactTab = hasExactDate && item.quickOption == I.FilterQuickOption.ExactDate;

	let wrapValue = false;
	let value = null;
	const onSubmit = e => onSubmitHandler(e);

	const textInput = (key?: string, placeholder?: string): any => (
		<div className="textInputWrapper">
			<Input
				key={key ? key : 'value-text'}
				ref={ref => inputRef.current = ref}
				value={item.value}
				placeholder={placeholder || translate(`placeholderCell${relation.format}`)}
				onFocus={onFocusText}
				onKeyUp={(e: any, v: string) => onChange('value', v, true)}
				onSelect={onSelect}
				readonly={isReadonly}
			/>
			<Icon className="clear" onClick={onClear} />
		</div>
	);

	switch (relation.format) {

		case I.RelationType.MultiSelect:
		case I.RelationType.Select: {
			const selectedIds = Relation.getArrayValue(item.value);

			value = (
				<OptionSelect
					ref={optionSelectRef}
					menuClassNameWrap="fromBlock"
					subId={getSubId()}
					relationKey={item.relationKey}
					value={selectedIds}
					isReadonly={isReadonly}
					onChange={v => onChange('value', v)}
					setActive={setActive}
					canAdd={true}
					canEdit={true}
					position={position}
					menuId={getId()}
				/>
			);
			break;
		};
		
		case I.RelationType.File:
		case I.RelationType.Object: {
			const selectedIds = Relation.getArrayValue(item.value);
			const filters: I.Filter[] = [];

			if (relation.format == I.RelationType.File) {
				filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() });
			};

			const types = relation.objectTypes || [];
			const canAddObject = !isReadonly && types.length == 1;

			value = (
				<OptionSelect
					ref={optionSelectRef}
					subId={getSubId()}
					relationKey={item.relationKey}
					value={selectedIds}
					isReadonly={isReadonly}
					onChange={v => onChange('value', v)}
					setActive={setActive}
					canAdd={canAddObject}
					position={position}
					menuId={getId()}
					menuClassNameWrap="fromBlock"
					searchParam={{
						types,
						filters,
					}}
					addParam={{
						details: types.length == 1 ? { type: types[0] } : {},
					}}
					dataChange={(items: any) => {
						if (!config.experimental) {
							return items;
						};

						const templates = Relation.filterTemplateOptions().map(it => ({ ...it, isSystem: true }));

						if (items.length) {
							templates.push({ isDiv: true });
						};

						return templates.concat(items);
					}}
					rootId={rootId}
				/>
			);
			break;
		};

		case I.RelationType.Checkbox: {
			value = (
				<>
					{checkboxOptions.map((option, i) => {
						const isSelected = (item.value ? '1' : '0') == option.id;
						return (
							<MenuItemVertical
								key={i}
								id={option.id}
								name={option.name}
								checkbox={isSelected}
								onClick={() => {
									onChange('value', Boolean(Number(option.id)));
								}}
								readonly={isReadonly}
							/>
						);
					})}
				</>
			);
			break;
		};

		case I.RelationType.Date: {
			if ([ I.FilterQuickOption.NumberOfDaysAgo, I.FilterQuickOption.NumberOfDaysNow ].includes(item.quickOption)) {
				value = textInput('filter-value-date-days-input', translate(`placeholderCell${I.RelationType.Number}`));
			} else
			if ([ I.FilterQuickOption.ExactDate ].includes(item.quickOption)) {
				value = (
					<CalendarSelect
						value={item.value}
						onChange={v => onChange('value', v)}
						isReadonly={isReadonly}
						canClear={true}
						position={position}
						className="isInline"
						menuClassNameWrap="fromBlock"
						showFooter={false}
					/>
				);
			} else {
				wrapValue = true;
			};
			break;
		};

		default: {
			value = textInput();
			break;
		};
	};

	if (Relation.isDictionary(item.relationKey)) {
		value = (
			<Select 
				id={[ 'filter', 'dictionary', item.id ].join('-')} 
				ref={ref => selectRef.current = ref}
				className="checkboxValue" 
				arrowClassName="light"
				options={Relation.getDictionaryOptions(item.relationKey)} 
				value={item.value}
				onChange={v => onChange('value', Number(v))}
				menuParam={selectParam}
				readonly={isReadonly}
			/>
		);
		wrapValue = true;
	};

	if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(item.condition)) {
		value = null;
	};

	if (value && wrapValue) {
		value = (
			<div
				id="item-value"
				className="item"
				onMouseEnter={onValueHover}
			>
				{value}
			</div>
		);
	};

	return (
		<div ref={nodeRef} className="inner">
			{!hideHead ? (
				<div className="head menuHead">
					<div className="conditionSelect" onClickCapture={onConditionClick}>
						<Label text={relationOption.name} />
						<Select
							ref={conditionRef}
							id={`filter-condition-${item.id}`}
							value={String(item.condition)}
							element={`#${getId()} .conditionSelect`}
							options={conditionOptions}
							onChange={v => onChange('condition', Number(v))}
							menuParam={Object.assign(selectParam, { width: 224, offsetY: 4 })}
							readonly={isReadonly}
						/>
					</div>
					{!isReadonly ? <Icon className="more withBackground" onClick={onMore} /> : ''}
				</div>
			) : ''}

			{hasExactDate ? (
				<div className="section noBorder">
					<TabSwitch
						value={isExactTab ? 'exact' : 'relative'}
						options={[
							{ id: 'exact', name: translate('menuDataviewFilterValuesExact') },
							{ id: 'relative', name: translate('menuDataviewFilterValuesRelative') },
						]}
						onChange={v => {
							if (v == 'exact') {
								onChange('quickOption', I.FilterQuickOption.ExactDate);
							} else {
								const first = items[0];
								if (first) {
									onChange('quickOption', first.id);
								};
							};
						}}
					/>
				</div>
			) : ''}

			{items.length && !isExactTab ? (
				<div className="section">
					{items.map((option: any, i: number) => (
						<MenuItemVertical
							key={i}
							id={String(option.id)}
							name={option.name}
							checkbox={item.quickOption == option.id}
							onClick={() => onChange('quickOption', option.id)}
							readonly={isReadonly}
						/>
					))}
				</div>
			) : ''}

			{value ? (
				<div className="section">
					<form id="value" onSubmit={onSubmit}>
						{value}
					</form>
				</div>
			) : ''}
		</div>
	);
	
}));

export default MenuDataviewFilterValues;

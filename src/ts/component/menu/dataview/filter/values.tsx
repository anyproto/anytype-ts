import React, { forwardRef, useRef, useEffect, useImperativeHandle, useState } from 'react';
import $ from 'jquery';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { I, S, U, J, translate, keyboard, analytics, Relation } from 'Lib';
import { Select, Tag, Icon, IconObject, Input, MenuItemVertical, Label } from 'Component';

const MenuDataviewFilterValues = observer(forwardRef<I.MenuRef, I.Menu>((props, ref) => {

	const { param, setHover, close, onKeyDown, setActive, getId, getSize } = props;
	const { data, className, classNameWrap } = param;
	const { rootId, blockId, getView, itemId, readonly, save, isInline, getTarget } = data;
	const nodeRef = useRef(null);
	const selectRef = useRef(null);
	const conditionRef = useRef(null);
	const inputRef = useRef(null);
	const range = useRef(null);
	const n = useRef(-1);
	const timeout = useRef(0);
	const [ dummy, setDummy ] = useState(0);

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
		setActive();

		const item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		const relation = S.Record.getRelationByKey(item.relationKey);

		if (!relation || !inputRef.current) {
			return;
		};

		const isDate = Relation.isDate(relation.format);

		if (inputRef.current.setValue) {
			if (isDate) {
				if (item.quickOption == I.FilterQuickOption.ExactDate) {
					inputRef.current.setValue(item.value === null ? '' : U.Date.date('d.m.Y H:i:s', item.value));
				} else {
					inputRef.current.setValue(item.value);
				};
			} else {
				inputRef.current.setValue(item.value);
			};
		};

		if (range.current && !isDate) {
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

		const item = view.getFilter(itemId);
		if (item) {
			checkClear(item.value);
		};
	};

	const getItems = () => {
		const view = getView();
		if (!view) {
			return [];
		};

		const item = view.getFilter(itemId);
		if (!item) {
			return [];
		};

		const relation: any = S.Record.getRelationByKey(item.relationKey) || {};
		const filterQuickOptions = Relation.filterQuickOptions(relation.format, item.condition);

		let filterOption: any = filterQuickOptions.find(it => it.id == item.quickOption);

		if (!filterOption) {
			filterOption = filterQuickOptions.length ? filterQuickOptions[0] : {};
		};

		const ret: any[] = [];

		if ((relation.format == I.RelationType.Date) && filterQuickOptions.length) {
			ret.push({ id: 'quickOption', icon: '', name: filterOption.name, format: relation.format, condition: item.condition, arrow: true });
		};

		return ret;
	};

	const onOver = (e: any, item: any) => {
		if (isReadonly || S.Menu.isAnimating('select')) {
			return;
		};

		if (!keyboard.isMouseDisabled) {
			setActive(item, false);
		};

		const menuParam = {
			className,
			classNameWrap,
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			vertical: I.MenuDirection.Center,
			isSub: true,
			noFlipY: true,
		};

		let options = [];
		if (item.id == 'quickOption') {
			options = Relation.filterQuickOptions(item.format, item.condition);
		};

		S.Menu.closeAll([ 'select' ], () => {
			S.Menu.open('select', {
				...menuParam,
				rebind,
				parentId: props.id,
				data: {
					noFilter: true,
					noVirtualisation: true,
					value: item[item.id],
					options,
					onSelect: (e: any, el: any) => {
						onChange(item.id, el.id);
					}
				}
			});
		});
	};

	const onChange = (k: string, v: any, withTimeout?: boolean) => {
		const view = getView();
		const object = getTarget();

		if (!view) {
			return;
		};
		
		let item = view.getFilter(itemId);
		if (!item) {
			return;
		};

		const relation = S.Record.getRelationByKey(item.relationKey);
		if (!relation) {
			return;
		};

		checkClear(v);

		window.clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => {
			item = U.Common.objectCopy(item);
			item[k] = v;

			if (k == 'condition') {
				if ([ I.FilterCondition.None, I.FilterCondition.Empty, I.FilterCondition.NotEmpty ].includes(v)) {
					item.value = Relation.formatValue(relation, null, false);
				};

				const quickOptions = Relation.filterQuickOptions(relation.format, item.condition);
				const filterOption = quickOptions.find(it => it.id == item.quickOption);

				if (!filterOption) {
					item.quickOption = quickOptions.length ? quickOptions[0].id : I.FilterQuickOption.ExactDate;
				};
			};

			if (k == 'quickOption') {
				item.value = Relation.formatValue(relation, null, false);
			};

			if (k == 'value') {
				item[k] = Relation.formatValue(relation, item[k], false);
			};

			view.setFilter(item);

			analytics.event('ChangeFilterValue', {
				condition: item.condition,
				objectType: object.type,
				embedType: analytics.embedType(isInline)
			});

			save();
			setDummy(dummy + 1);
		}, withTimeout ? 1000 : 0);
	};

	const onDelete = (e: any, element: any) => {
		const view = getView();
		const item = view.getFilter(itemId);

		if (!item) {
			return;
		};

		let value = Relation.getArrayValue(item.value);
		value = value.filter(it => it != element.id);
		value = U.Common.arrayUnique(value);

		onChange('value', value);
	};

	const onSubmitHandler = (e: any) => {
		e.preventDefault();

		getView().setFilter({ id: itemId, value: inputRef.current.getValue() });
		close();
	};

	const onSubmitDate = (e: any) => {
		e.preventDefault();

		const value = U.Date.parseDate(inputRef.current.getValue());
		
		onChange('value', value);
		onCalendar(value);
	};

	const onFocusText = () => {
		S.Menu.close('select');
	};

	const onFocusDate = (e: any) => {
		if (isReadonly) {
			return;
		};

		const item = getView().getFilter(itemId);
		const value = item.value || U.Date.now();

		S.Menu.closeAll([ 'select' ], () => {
			if (S.Menu.isOpen('calendar')) {
				S.Menu.updateData('calendar', { value });
			} else {
				onCalendar(value);
			};
		});
	};

	const onSelect = (e: any) => {
		range.current = {
			from: e.currentTarget.selectionStart,
			to: e.currentTarget.selectionEnd,
		};
	};

	const onCalendar = (value: number) => {
		const item = getView().getFilter(itemId);

		S.Menu.open('calendar', {
			className,
			classNameWrap,
			element: `#${getId()} #value`,
			horizontal: I.MenuDirection.Center,
			rebind,
			parentId: props.id,
			data: { 
				value, 
				canEdit: true,
				relationKey: item.relationKey,
				onChange: (value: number) => {
					onChange('value', value);
				},
			},
		});
	};

	const onTag = () => {
		if (isReadonly) {
			return;
		};

		const item = getView().getFilter(itemId);
		const relation = S.Record.getRelationByKey(item.relationKey);

		S.Menu.closeAll([ 'dataviewOptionList', 'select' ], () => {
			S.Menu.open('dataviewOptionList', { 
				element: `#${getId()} #value`,
				className: [ 'fromFilter', className ].join(' '),
				classNameWrap,
				width: getSize().width,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				rebind,
				parentId: props.id,
				data: { 
					rootId: rootId,
					blockId: blockId,
					value: item.value || [], 
					relation: observable.box(relation),
					canAdd: true,
					canEdit: true,
					onChange: value => onChange('value', value),
				},
			});
		});
	};

	const onObject = (e: any, item: any) => {
		if (isReadonly) {
			return;
		};

		const relation = S.Record.getRelationByKey(item.relationKey);
		const filters = [];

		if (relation.format == I.RelationType.File) {
			filters.push({ relationKey: 'resolvedLayout', condition: I.FilterCondition.In, value: U.Object.getFileLayouts() });
		};

		S.Menu.closeAll([ 'dataviewObjectValues', 'dataviewObjectList', 'select' ], () => {
			S.Menu.open('dataviewObjectList', { 
				className: [ className, 'fromFilter' ].join(' '), 
				classNameWrap,
				element: `#${getId()}`,
				width: getSize().width,
				horizontal: I.MenuDirection.Center,
				noFlipY: true,
				rebind,
				parentId: props.id,
				data: { 
					rootId,
					blockId,
					value: item.value, 
					types: relation.objectTypes,
					filters,
					relation: observable.box(relation),
					canAdd: true,
					canEdit: true,
					onChange: (value: any, callBack?: () => void) => {
						onChange('value', value);
						callBack?.();
					},
				},
			});
		});
	};

	const getRelationOptions = () => {
		return Relation.getFilterOptions(rootId, blockId, getView());
	};

	const checkClear = (v: any) => {
		$(nodeRef.current).find('.icon.clear').toggleClass('active', v);
	};

	const onClear = (e: any) => {
		e.stopPropagation();

		range.current = null;
		onChange('value', null);
	};

	const onValueHover = (e: React.MouseEvent) => {
		e.persist();

		S.Menu.closeAll([ 'select' ], () => {
			selectRef.current?.show(e);
			window.setTimeout(() => setHover({ id: 'value' }), 35);
		});
	};

	const onSelectClose = () => {
		setHover();
	};

	const onConditionClick = (e: React.MouseEvent) => {
		e.stopPropagation();

		if (S.Menu.isOpen('select')) {
			S.Menu.close('select');
		} else {
			conditionRef.current?.show(e);
		};
	};

	const view = getView();
	if (!view) {
		return null;
	};

	const item = view.getFilter(itemId);
	if (!item) {
		return null;
	};

	const isReadonly = readonly || !S.Block.checkFlags(rootId, blockId, [ I.RestrictionDataview.View ]);
	const relation: any = S.Record.getRelationByKey(item.relationKey) || {};
	const relationOptions = getRelationOptions();
	const conditionOptions = Relation.isDictionary(item.relationKey)
		? Relation.filterConditionsDictionary()
		: Relation.filterConditionsByType(relation.format);
	const checkboxOptions: I.Option[] = [
		{ id: '1', name: translate('menuDataviewFilterValuesChecked') },
		{ id: '0', name: translate('menuDataviewFilterValuesUnchecked') },
	];
	const relationOption: any = relationOptions.find(it => it.id == item.relationKey) || {};
	const conditionOption: any = conditionOptions.find(it => it.id == item.condition) || {};
	const items = getItems();
	const selectParam = {
		width: 260,
		isSub: true,
		noScroll: true,
		noVirtualisation: true,
		onClose: onSelectClose,
		className,
		classNameWrap,
	};

	let wrapValue = false;
	let value = null;
	let Item = null;
	let list = [];
	let onSubmit = e => onSubmitHandler(e);

	const ItemAdd = (item: any) => (
		<div 
			id="item-add" 
			className="item add" 
			onClick={item.onClick} 
			onMouseEnter={() => { 
				S.Menu.close('select', () => {
					window.setTimeout(() => setHover({ id: 'add' }), 35);
				});
			}}
		>
			<Icon className="plus" />
			<div className="name">{translate('commonAdd')}</div>
		</div>
	);

	switch (relation.format) {

		case I.RelationType.MultiSelect:
		case I.RelationType.Select: {
			Item = (element: any) => {
				return (
					<div 
						id={`item-tag-${element.id}`} 
						className={[ 'item', (isReadonly ? 'isReadonly' : '') ].join(' ')}
						onMouseEnter={() => {
							S.Menu.close('select'); 
							setHover({ id: `tag-${element.id}` }); 
						}}
					>
						<div className="clickable" onClick={onTag}>
							<Tag
								text={element.name}
								color={element.color}
								className={Relation.selectClassName(relation.format)} 
							/>
						</div>
						<div className="buttons">
							<Icon className="delete" onClick={e => onDelete(e, element)} />
						</div>
					</div>
				);
			};

			list = Relation.getOptions(item.value);

			value = (
				<>
					{!isReadonly ? <ItemAdd onClick={onTag} /> : ''}
					{list.map(element => <Item key={element.id} {...element} />)}
				</>
			);
			break;
		};
		
		case I.RelationType.File:
		case I.RelationType.Object: {
			Item = (element: any) => {	
				const type = S.Record.getTypeById(element.type);

				return (
					<div 
						id={`item-object-${element.id}`} 
						className={[ 'item', 'withCaption', (isReadonly ? 'isReadonly' : '') ].join(' ')}
						onMouseEnter={() => setHover({ id: `object-${element.id}` })}
					>
						<div className="clickable" onClick={e => onObject(e, item)}>
							<IconObject object={element} />
							<div className="name">{element.name}</div>
						</div>
						<div className="caption">
							{type?.name}
						</div>
						<div className="buttons">
							<Icon className="delete withBackground" onClick={e => onDelete(e, element)} />
						</div>
					</div>
				);
			};

			list = Relation.getArrayValue(item.value).map(it => S.Detail.get(rootId, it, []));
			list = list.filter(it => !it._empty_);

			value = (
				<>
					{!isReadonly ? <ItemAdd onClick={e => onObject(e, item)} /> : ''}
					{list.map((item: any, i: number) => <Item key={i} {...item} />)}
				</>
			);
			break;
		};

		case I.RelationType.Checkbox: {
			value = (
				<Select 
					id={[ 'filter', 'checkbox', item.id ].join('-')} 
					ref={ref => selectRef.current = ref}
					className="checkboxValue" 
					arrowClassName="light"
					options={checkboxOptions} 
					value={item.value ? '1' : '0'}
					onChange={v => onChange('value', Boolean(Number(v)), true)} 
					menuParam={selectParam}
					readonly={isReadonly}
				/>
			);
			wrapValue = true;
			break;
		};

		case I.RelationType.Date: {
			if ([ I.FilterQuickOption.NumberOfDaysAgo, I.FilterQuickOption.NumberOfDaysNow ].includes(item.quickOption)) {
				value = (
					<>
						<Input 
							key="filter-value-date-days-input"
							ref={ref => inputRef.current = ref} 
							value={item.value} 
							placeholder={translate('commonValue')} 
							onFocus={onFocusText}
							onKeyUp={(e: any, v: string) => onChange('value', v, true)} 
							onSelect={onSelect}
							readonly={isReadonly}
						/>
						<Icon className="clear" onClick={onClear} />
					</>
				);
			} else
			if ([ I.FilterQuickOption.ExactDate ].includes(item.quickOption)) {
				value = (
					<>
						<Input 
							key="filter-value-date-exact-input"
							ref={ref => inputRef.current = ref} 
							value={item.value !== null ? U.Date.date('d.m.Y H:i:s', item.value) : ''} 
							placeholder="dd.mm.yyyy hh:mm:ss"
							maskOptions={{ mask: '99.99.9999 99:99:99' }}
							onFocus={onFocusDate}
							onSelect={onSelect}
							readonly={isReadonly}
						/>
						<Icon className="clear" onClick={onClear} />
					</>
				);
				onSubmit = onSubmitDate;
			};
			wrapValue = true;
			break;
		};

		default: {
			value = (
				<>
					<Input 
						ref={ref => inputRef.current = ref} 
						value={item.value} 
						placeholder={translate('commonValue')} 
						onFocus={onFocusText}
						onKeyUp={(e: any, v: string) => onChange('value', v, true)} 
						onSelect={onSelect}
						readonly={isReadonly}
					/>
					<Icon className="clear" onClick={onClear} />
				</>
			);
			wrapValue = true;
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
				onChange={v => onChange('value', Number(v), true)} 
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

	useImperativeHandle(ref, () => ({
		rebind,
		unbind,
		getItems,
		getIndex: () => n.current,
		setIndex: (i: number) => n.current = i,
		getFilterRef: () => inputRef.current,
		onOver,
	}), []);

	return (
		<div ref={nodeRef}>
			<div className="head">
				<Label text={relationOption.name} />
				<div onClickCapture={onConditionClick}>
					<Select
						ref={conditionRef}
						id={`filter-condition-${item.id}`}
						value={String(item.condition)}
						options={conditionOptions}
						onChange={v => onChange('condition', Number(v))}
						menuParam={selectParam}
						readonly={isReadonly}
					/>
				</div>
			</div>

			<div className="section">
				{items.map((item: any, i: number) => (
					<MenuItemVertical 
						key={i} 
						{...item} 
						onMouseEnter={e => onOver(e, item)} 
						readonly={isReadonly} 
					/>
				))}
			</div>

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
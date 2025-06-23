import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { I, C, S, U, J, analytics, keyboard, Relation, Action, Preview, translate } from 'Lib';

import CellText from './text';
import CellSelect from './select';
import CellCheckbox from './checkbox';
import CellObject from './object';
import CellFile from './file';

interface Props extends I.Cell {
	elementId?: string;
	tooltipParam?: I.TooltipParam;
	maxWidth?: number;
	inplaceEditing?: boolean;
};

const Cell = observer(forwardRef<I.CellRef, Props>((props, ref) => {

	const { 
		elementId, relationKey, recordId, getRecord, getView, idPrefix, pageContainer,
		isInline, menuClassName = '', menuClassNameWrap = '', block, subId, rootId, onCellChange,
		onMouseEnter, onMouseLeave, maxWidth, cellPosition, onClick, readonly, tooltipParam = {},
		inplaceEditing,
	} = props;
	const view = getView ? getView() : null;
	const record = getRecord(recordId);
	const relation = S.Record.getRelationByKey(relationKey) || {};
	const isName = relationKey == 'name';
	const nodeRef = useRef(null);
	const childRef = useRef<I.CellRef>(null);
	const cellId = Relation.cellId(idPrefix, relation.relationKey, record.id);

	const checkIcon = () => {
		
		const node = $(nodeRef.current);
		const icon = node.find('.iconObject');

		node.removeClass('withIcon');

		if (view && view.hideIcon) {
			return;
		};

		if (!relation || !isName) {
			return;
		};

		if (icon.length) {
			node.addClass('withIcon');
		};
	};

	const checkValue = (): boolean => {
		return isName ? true : Relation.checkRelationValue(relation, record[relation.relationKey]);
	};

	const onClickHandler = (e: any) => {
		e.stopPropagation();

		if (!relation || !record) {
			return;
		};

		if (inplaceEditing) {
			onInplaceEdit(e);
			return;
		};

		const value = record[relation.relationKey] || '';
		const canEdit = canCellEdit(relation, record);
		const placeholder = getPlaceholder(relation, record);
		const check = checkValue();

		if (!canEdit) {
			if (check && (relation.format != I.RelationType.Checkbox)) {
				if (Relation.isUrl(relation.format)) {
					Action.openUrl(Relation.checkUrlScheme(relation.format, value));
					return;
				};

				if (Relation.isDate(relation.format)) {
					U.Object.openDateByTimestamp(relation.relationKey, value, 'config');
					return;
				};
			} else {
				return;
			};
		};

		const { config } = S.Common;
		const win = $(window);
		const cell = $(`#${cellId}`);
		const className = [];

		if (menuClassName) {
			className.push(menuClassName);
		};

		if (isInline) {
			className.push('isInline');
		};

		let width = Math.max(J.Size.dataview.cell.edit, cell.outerWidth());
		let closeIfOpen = true;
		let menuId = '';

		if (undefined !== maxWidth) {
			width = Math.min(width, maxWidth);
		};

		const setOn = () => {
			cell.addClass('isEditing');

			if (cellPosition) {
				cellPosition(cellId);
			};

			if (menuId) {
				keyboard.disableBlur(true);
			};

			if (childRef.current) {
				if (childRef.current.setEditing) {
					childRef.current.setEditing(true);
				};

				if (childRef.current.onClick) {
					childRef.current.onClick(e);
				};
			};

			keyboard.disableSelection(true);
			win.trigger('resize');
		};

		const setOff = () => {
			keyboard.disableBlur(false);
			keyboard.disableSelection(false);

			if (childRef.current) {
				if (childRef.current.onBlur) {
					childRef.current.onBlur();
				};

				if (childRef.current.setEditing) {
					childRef.current.setEditing(false);
				};
			};

			$(`#${cellId}`).removeClass('isEditing');
			S.Common.cellId = '';
		};

		let ret = false;
		let param: I.MenuParam = { 
			element: `#${cellId} .cellContent`,
			horizontal: I.MenuDirection.Center,
			offsetY: 2,
			noAnimation: true,
			passThrough: true,
			className: className.join(' '),
			classNameWrap: menuClassNameWrap,
			onOpen: () => setOn(),
			onClose: () => setOff(),
			data: { 
				cellId,
				cellRef: childRef.current,
				rootId,
				subId,
				blockId: block.id,
				value, 
				relation: observable.box(relation),
				relationKey: relation.relationKey,
				record,
				placeholder,
				canEdit,
				onChange: (value: any, callBack?: (message: any) => void) => {
					if (childRef.current && childRef.current.onChange) {
						childRef.current.onChange(value);
					};

					onChange(value, callBack);
				},
			},
		};

		switch (relation.format) {

			case I.RelationType.Date: {
				param.data = Object.assign(param.data, {
					value: param.data.value || U.Date.now(),
					noKeyboard: true,
				});
					
				menuId = 'calendar';
				closeIfOpen = false;
				break;
			};

			case I.RelationType.File: {
				param = Object.assign(param, {
					width,
				});
				param.data = Object.assign(param.data, {
					value: value || [],
				});

				menuId = 'dataviewFileValues';
				break;
			};

			case I.RelationType.Select: 
			case I.RelationType.MultiSelect: {
				param = Object.assign(param, {
					width,
					commonFilter: true,
				});
				param.data = Object.assign(param.data, {
					canAdd: true,
					filter: '',
					value: value || [],
					maxCount: relation.maxCount,
					noFilter: true,
				});

				menuId = 'dataviewOptionList';

				closeIfOpen = false;
				break;
			};
					
			case I.RelationType.Object: {
				param = Object.assign(param, {
					width,
					commonFilter: true,
				});
				param.data = Object.assign(param.data, {
					canAdd: true,
					filter: '',
					value: value || [],
					types: relation.objectTypes,
					maxCount: relation.maxCount,
					noFilter: true,
				});

				menuId = 'dataviewObjectList';
				
				closeIfOpen = false;
				break;
			};

			case I.RelationType.LongText: {
				const wh = win.height();
				const hh = J.Size.header;
				const height = Math.min(wh - hh - 20, cell.outerHeight());

				param = Object.assign(param, {
					noFlipX: true,
					noFlipY: true,
					element: cell,
					horizontal: I.MenuDirection.Left,
					offsetY: -height,
					width,
					height: height,
				});

				menuId = 'dataviewText';
				closeIfOpen = false;
				break;
			};

			case I.RelationType.Url:
			case I.RelationType.Email:
			case I.RelationType.Phone: {
				param = Object.assign(param, {
					commonFilter: true,
					width,
				});

				if (e.shiftKey && value) {
					Action.openUrl(Relation.checkUrlScheme(relation.format, value));

					ret = true;
					break;
				};

				if (!value) {
					break;
				};

				const options = [
					{ id: 'go', icon: 'browse', name: translate(`menuDataviewUrlActionGo${relation.format}`) },
					{ id: 'copy', icon: 'copy', name: translate('commonCopyLink') },
				];
				if (relation.relationKey == 'source') {
					options.push({ id: 'reload', icon: 'reload', name: translate('menuDataviewUrlActionGoReload') });
				};

				param.data = Object.assign(param.data, {
					disabled: !value, 
					noFilter: true,
					options,
					onSelect: (event: any, item: any) => {
						const value = childRef.current.getValue();
						if (!value) {
							return;
						};

						switch (item.id) {
							case 'go': {
								Action.openUrl(Relation.checkUrlScheme(relation.format, value));
								analytics.event('RelationUrlOpen');
								break;
							};

							case 'copy': {
								U.Common.clipboardCopy({ text: value, html: value });
								analytics.event('RelationUrlCopy');
								break;
							};

							case 'reload': {
								C.ObjectBookmarkFetch(record.id, value, () => analytics.event('ReloadSourceData'));
								break;
							};
						};
					},
				});

				menuId = 'select';
				closeIfOpen = false;
				break;
			};
					
			case I.RelationType.Checkbox: {
				if (childRef.current.onClick) {
					childRef.current.onClick(e);
				};
				ret = true;
				break; 
			};
		};

		if (ret) {
			cell.removeClass('isEditing');
			return;
		};

		const bindContainerClick = () => {
			const pc = $(pageContainer);

			pc.off(`mousedown.cell${cellId}`).on(`mousedown.cell${cellId}`, (e: any) => { 
				if (!$(e.target).parents(`#${cellId}`).length) {
					S.Menu.closeAll(J.Menu.cell);
					setOff();

					pc.off(`mousedown.cell${cellId}`);
				};
			});
		};

		if (menuId) {
			if (S.Common.cellId != cellId) {
				S.Common.cellId = cellId;
				
				const isOpen = S.Menu.isOpen(menuId);

				S.Menu.open(menuId, param);

				// If menu was already open OnOpen callback won't be called
				if (isOpen) {
					setOn();
				};

				bindContainerClick();

				if (!config.debug.ui) {
					win.off('blur.cell').on('blur.cell', () => S.Menu.closeAll(J.Menu.cell));
				};
			} else 
			if (closeIfOpen) {
				setOff();
				S.Menu.closeAll(J.Menu.cell);
			};
		} else {
			setOn();

			if (!canEdit && Relation.isText(relation.format)) {
				bindContainerClick();
			};
		};
	};

	const onChange = (value: any, callBack?: (message: any) => void) => {
		if (!relation) {
			return null;
		};

		value = Relation.formatValue(relation, value, true);
		if (onCellChange) {
			onCellChange(record.id, relation.relationKey, value, callBack);
		};
	};

	const onMouseEnterHandler = (e: any) => {
		const cell = $(`#${Relation.cellId(idPrefix, relation.relationKey, record.id)}`);
		const { text = '', caption = '' } = tooltipParam;
		const t = Preview.tooltipCaption(text, caption);

		if (onMouseEnter) {
			onMouseEnter(e);
		};

		if (t) {
			Preview.tooltipShow({ ...tooltipParam, text: t, element: cell });
		};
	};
	
	const onMouseLeaveHandler = (e: any) => {
		if (onMouseLeave) {
			onMouseLeave(e);
		};

		Preview.tooltipHide(false);
	};

	const onInplaceEdit = (e) => {
		e.persist();
		e.stopPropagation();

		if (S.Menu.isOpen()) {
			S.Menu.closeAll();
			return;
		};

		let menuId = '';
		let menuParam: any = {};
		let menuData: any = {};
		let ret = false;

		switch (relation.format) {
			case I.RelationType.Object: {
				menuId = 'dataviewObjectValues';
				menuParam.subIds = [ 'dataviewObjectList' ];
				menuData = {
					types: relation.objectTypes,
					value: Relation.getArrayValue(record[relationKey]),
					filters: []
				};
				break;
			};

			case I.RelationType.Date: {
				let value = null;
				let isEmpty = false;

				if (record[relationKey]) {
					value = Number(record[relationKey]);
				} else {
					value = Number(U.Date.now());
					isEmpty = true;
				};

				if (!canCellEdit(relation, record)) {
					U.Object.openDateByTimestamp(relationKey, value, 'config');
					ret = true;
					break;
				};

				menuId = 'calendar';
				menuData = {
					value,
					isEmpty,
				};
				break;
			};

			case I.RelationType.Select:
			case I.RelationType.MultiSelect: {
				menuId = 'dataviewOptionList';
				menuData = {
					value: Relation.getArrayValue(record[relationKey]),
					canAdd: true,
					maxCount: relation.maxCount,
				};
				break;
			};

			case I.RelationType.File: {
				menuId = 'dataviewFileValues';
				menuParam = {
					width: 280,
					subIds: [ 'dataviewFileList' ],
				};
				menuData = {
					value: record[relationKey] || [],
					subId: rootId,
				};
				break;
			};

			case I.RelationType.Number:
			case I.RelationType.Url:
			case I.RelationType.Phone:
			case I.RelationType.Email:
			case I.RelationType.ShortText:
			case I.RelationType.LongText: {
				menuId = 'dataviewText';
				menuParam.width = 288;
				menuData.value = record[relationKey] || '';
				break;
			};

			case I.RelationType.Checkbox: {
				if (!canCellEdit(relation, record)) {
					ret = true;
					break;
				};

				const value = Relation.formatValue(relation, !record[relationKey], true);

				C.ObjectListSetDetails([ record.id ], [ { key: relationKey, value } ]);
				analytics.changeRelationValue(relation, value, { type: 'featured', id: 'Single' });
				return;
			};
		};

		if (!ret && menuId) {
			onCellMenu(relationKey, menuId, menuParam, menuData);
		};
	};

	const onCellMenu = (relationKey: string, menuId: string, param: any, data: any) => {
		let menuParam = {
			element: `#${cellId}`,
			className: 'fromFeatured',
			offsetY: 4,
			noFlipX: true,
			title: relation.name,
			onClose: () => S.Menu.closeAll(),
			data: {
				rootId,
				blockId: block.id,
				relation: observable.box(relation),
				relationKey: relation.relationKey,
				canEdit: canCellEdit(relation, record),
				onChange: (v: any, callBack?: () => void) => {
					const value = Relation.formatValue(relation, v, true);

					C.ObjectListSetDetails([ record.id ], [ { key: relationKey, value } ]);
					analytics.changeRelationValue(relation, value, { type: 'featured', id: 'Single' });

					if (callBack) {
						callBack();
					};
				}
			}
		};

		menuParam = Object.assign(menuParam, param);
		menuParam.data = Object.assign(menuParam.data, data);

		S.Menu.closeAll(J.Menu.cell, () => {
			S.Menu.open(menuId, menuParam);
		});
	};

	const getPlaceholder = (relation: any, record: any): string => {
		if (!relation.id) {
			return translate(`placeholderCellCommon`);
		};

		const canEdit = canCellEdit(relation, record);
		return !canEdit ? translate(`placeholderCellCommon`) : (props.placeholder || translate(`placeholderCell${relation.format}`));
	};

	const canCellEdit = (relation: any, record: any): boolean => {
		if (readonly) {
			return false;
		};

		if (!relation || !record || relation.isReadonlyValue || record.isReadonly) {
			return false;
		};
		if (U.Object.isNoteLayout(record.layout) && (relation.relationKey == 'name')) {
			return false;
		};
		return true;
	};

	if (view) {
		const { hideIcon } = view;
	};

	const id = Relation.cellId(idPrefix, relation.relationKey, record.id);
	const canEdit = canCellEdit(relation, record);
	const placeholder = getPlaceholder(relation, record);
	const cn = [ 
		'cellContent', 
		'c-' + relation.relationKey,
		Relation.className(relation.format), 
		(canEdit ? 'canEdit' : ''), 
		(relationKey == 'name' ? 'isName' : ''),
		(!checkValue() ? 'isEmpty' : ''),
	];

	let CellComponent: any = null;

	const childProps = {
		...props,
		id,
		key: id,
		canEdit,
		relation,
		placeholder,
		onChange,
	};

	switch (relation.format) {
		default:
		case I.RelationType.ShortText:
		case I.RelationType.Number:
		case I.RelationType.LongText:
		case I.RelationType.Date:
			CellComponent = CellText;
			break;

		case I.RelationType.Select:	
		case I.RelationType.MultiSelect:
			CellComponent = CellSelect;
			break;
			
		case I.RelationType.Checkbox:
			CellComponent = CellCheckbox;
			break;

		case I.RelationType.File:
			CellComponent = CellFile;
			break;
			
		case I.RelationType.Object:
			CellComponent = CellObject;
			break;
			
		case I.RelationType.Url:
		case I.RelationType.Email:
		case I.RelationType.Phone:
			CellComponent = CellText;
			break;
	};

	useEffect(() => checkIcon());

	useImperativeHandle(ref, () => ({
		onClick: onClickHandler,
		isEditing: () => childRef.current.isEditing(),
		canEdit: () => canCellEdit(relation, record),
	}));

	return (
		<div 
			ref={nodeRef} 
			id={elementId} 
			className={cn.join(' ')} 
			onClick={onClick} 
			onMouseEnter={onMouseEnterHandler} 
			onMouseLeave={onMouseLeaveHandler}
		>
			<CellComponent ref={childRef} {...childProps} />
		</div> 
	);

}));

export default Cell;

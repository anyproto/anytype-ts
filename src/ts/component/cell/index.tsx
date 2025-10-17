import React, { forwardRef, useRef, useImperativeHandle } from 'react';
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
	noInplace?: boolean;
	editModeOn?: boolean;
};

const Cell = observer(forwardRef<I.CellRef, Props>((props, ref) => {

	const { 
		elementId, relationKey, recordId, getRecord, getView, idPrefix, pageContainer,
		isInline, menuParam = {}, block, subId, rootId, onCellChange,
		onMouseEnter, onMouseLeave, maxWidth, cellPosition, onClick, readonly, tooltipParam = {},
		noInplace, editModeOn, viewType,
	} = props;
	const view = getView ? getView() : null;
	const record = getRecord(recordId);
	const relation = S.Record.getRelationByKey(relationKey) || {};
	const isName = relationKey == 'name';
	const nodeRef = useRef(null);
	const childRef = useRef<I.CellRef>(null);
	const cellId = Relation.cellId(idPrefix, relation.relationKey, record.id);
	const withMenu = useRef(false);

	const checkValue = (): boolean => {
		if ((noInplace && editModeOn) || withMenu.current) {
			return true;
		};
		return isName ? true : Relation.checkRelationValue(relation, record[relation.relationKey]);
	};

	const onClickHandler = (e: any) => {
		e.stopPropagation();

		if (!relation || !record) {
			return;
		};

		const value = record[relation.relationKey] || '';
		const canEdit = canCellEdit(relation, record);
		const placeholder = getPlaceholder(relation, record);
		const check = checkValue();
		const isGrid = viewType == I.ViewType.Grid;
		const isName = relationKey == 'name';

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
		const cellContent = cell.hasClass('cellContent') ? cell : cell.find('.cellContent');

		if (menuParam.className) {
			className.push(menuParam.className);
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
			if (noInplace) {
				return;
			};

			if (!isGrid && isName) {
				cellContent.css({ height: cellContent.outerHeight() });
			};

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

			if (!isGrid && isName) {
				cellContent.css({ height: '' });
			};

			$(`#${cellId}`).removeClass('isEditing');
			S.Common.cellId = '';
		};

		const element = cell.hasClass('cellContent') ? `#${cellId}` : `#${cellId} .cellContent`;

		let ret = false;
		let param: I.MenuParam = { 
			element,
			horizontal: isGrid ? I.MenuDirection.Center : I.MenuDirection.Left,
			offsetY: 2,
			noAnimation: true,
			passThrough: true,
			...menuParam,
			onOpen: () => {
				$(element).addClass('withMenu');
				setOn();
			},
			onClose: () => {
				$(element).removeClass('withMenu');
				setOff();
			},
			data: { 
				cellId,
				cellRef: childRef.current,
				rootId,
				subId,
				blockId: block?.id,
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

		if (noInplace) {
			param.title = relation.name;
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
				if (!noInplace) {
					param = Object.assign(param, { width });
				};

				param.data = Object.assign(param.data, {
					value: value || [],
				});

				menuId = 'dataviewFileValues';
				break;
			};

			case I.RelationType.Select: 
			case I.RelationType.MultiSelect: {
				if (!noInplace) {
					param = Object.assign(param, {
						width,
						commonFilter: true,
					});
				};

				param.data = Object.assign(param.data, {
					canAdd: true,
					filter: '',
					value: value || [],
					maxCount: relation.maxCount,
					noFilter: !noInplace,
				});

				menuId = 'dataviewOptionList';

				closeIfOpen = false;
				break;
			};
					
			case I.RelationType.Object: {
				if (!noInplace) {
					param = Object.assign(param, {
						width,
						commonFilter: true,
					});
				};

				param.data = Object.assign(param.data, {
					canAdd: true,
					filter: '',
					value: Relation.getArrayValue(record[relationKey]),
					types: relation.objectTypes,
					maxCount: relation.maxCount,
					noFilter: !noInplace,
				});

				menuId = 'dataviewObjectList';

				if (noInplace) {
					menuId = 'dataviewObjectValues';
					param.subIds = [ 'dataviewObjectList' ];
				};
				
				closeIfOpen = false;
				break;
			};

			case I.RelationType.Number: {
				if (!noInplace) {
					break;
				};

				param = Object.assign(param, {
					width: 288,
				});
				param.data = Object.assign(param.data, {
					noResize: true,
				});

				menuId = 'dataviewText';
				closeIfOpen = false;
				break;
			};

			case I.RelationType.LongText: {
				if (!noInplace) {
					const wh = win.height();
					const hh = J.Size.header;
					const height = Math.min(wh - hh - 20, cell.outerHeight());

					param = Object.assign(param, {
						noFlipX: true,
						noFlipY: true,
						horizontal: I.MenuDirection.Left,
						element: cell,
						offsetY: -height,
						width,
						height,
					});
				} else {
					param = Object.assign(param, {
						width: 288,
					});
					param.data = Object.assign(param.data, {
						noResize: true,
					});
				};

				menuId = 'dataviewText';
				closeIfOpen = false;
				break;
			};

			case I.RelationType.Url:
			case I.RelationType.Email:
			case I.RelationType.Phone: {
				if (noInplace) {
					param = Object.assign(param, {
						width: 288,
					});
					param.data = Object.assign(param.data, {
						noResize: true,
					});
					menuId = 'dataviewText';
					closeIfOpen = false;

					break;
				};

				param = Object.assign(param, {
					commonFilter: !noInplace,
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
					noFilter: !noInplace,
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
								C.ObjectBookmarkFetch(record.id, value.trim(), () => analytics.event('ReloadSourceData'));
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
				withMenu.current = true;

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
				withMenu.current = false;
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
		(editModeOn ? 'editModeOn' : ''),
		(withMenu.current ? 'withMenu' : ''),
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

	useImperativeHandle(ref, () => ({
		onClick: onClickHandler,
		isEditing: () => childRef.current.isEditing(),
		canEdit: () => canCellEdit(relation, record),
		onBlur: () => {
			if (childRef.current.onBlur) {
				childRef.current.onBlur();
			};
		},
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

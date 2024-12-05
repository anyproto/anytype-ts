import * as React from 'react';
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
	showTooltip?: boolean;
	tooltipX?: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	tooltipY?: I.MenuDirection.Top | I.MenuDirection.Bottom;
	maxWidth?: number;
	recordIdx?: number;
};

const Cell = observer(class Cell extends React.Component<Props> {

	node: any = null;
	public static defaultProps = {
		canOpen: true,
	};

	ref = null;
	timeout = 0;
	
	constructor (props: Props) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
	};

	render () {
		const { elementId, relationKey, recordId, getRecord, getView, onClick, idPrefix } = this.props;
		const record = getRecord(recordId);
		const relation = this.getRelation();
		const view = getView ? getView() : null;

		if (!relation || !record) {
			return null;
		};

		if (view) {
			const { hideIcon } = view;
		};

		const id = Relation.cellId(idPrefix, relation.relationKey, record.id);
		const canEdit = this.canCellEdit(relation, record);
		const cn = [ 
			'cellContent', 
			'c-' + relation.relationKey,
			Relation.className(relation.format), 
			(canEdit ? 'canEdit' : ''), 
			(relationKey == 'name' ? 'isName' : ''),
			(!this.checkValue() ? 'isEmpty' : ''),
		];

		let CellComponent: any = null;
		let placeholder = this.props.placeholder || translate(`placeholderCell${relation.format}`); 

		if (!canEdit) {
			placeholder = translate(`placeholderCellCommon`);
		};

		const props = {
			...this.props,
			ref: ref => this.ref = ref,
			id,
			key: id,
			canEdit,
			relation,
			placeholder,
			onChange: this.onChange,
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

		return (
			<div 
				ref={node => this.node = node} 
				id={elementId} 
				className={cn.join(' ')} 
				onClick={onClick} 
				onMouseEnter={this.onMouseEnter} 
				onMouseLeave={this.onMouseLeave}
			>
				<CellComponent {...props} />
			</div>
		);
	};

	componentDidMount () {
		this.checkIcon();
	};

	componentDidUpdate () {
		this.checkIcon();
	};

	checkIcon () {
		const { getView } = this.props;
		const view = getView ? getView() : null;
		const node = $(this.node);

		node.removeClass('withIcon');

		if (view && view.hideIcon) {
			return;
		};

		const relation = this.getRelation();
		if (!relation || (relation.relationKey != 'name')) {
			return;
		};

		const icon = node.find('.iconObject');

		if (icon.length) {
			node.addClass('withIcon');
		};
	};

	checkValue (): boolean {
		const { recordId, getRecord } = this.props;
		const record = getRecord(recordId);
		const relation = this.getRelation();

		if (relation.relationKey == 'name') {
			return true;
		};

		return Relation.checkRelationValue(relation, record[relation.relationKey]);
	};

	onClick (e: any) {
		e.stopPropagation();

		const { rootId, subId, recordId, getRecord, block, maxWidth, menuClassName, menuClassNameWrap, idPrefix, cellPosition, placeholder, isInline } = this.props;
		const record = getRecord(recordId);
		const relation = this.getRelation();

		if (!relation || !record) {
			return;
		};

		const value = record[relation.relationKey] || '';
		const canEdit = this.canCellEdit(relation, record);

		if (!canEdit) {
			if (Relation.isUrl(relation.format) && value) {
				Action.openUrl(Relation.checkUrlScheme(relation.format, value));
				return;
			};

			if (relation.format == I.RelationType.Date) {
				U.Object.openDateByTimestamp(relation.relationKey, value, 'config');
				return;
			}

			if (relation.format == I.RelationType.Checkbox) {
				return;
			};
		};

		const { config } = S.Common;
		const cellId = Relation.cellId(idPrefix, relation.relationKey, record.id);
		const win = $(window);
		const cell = $(`#${cellId}`);
		const className = [];
		const pageContainer = $(this.props.pageContainer);

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

			if (this.ref && this.ref.setEditing) {
				this.ref.setEditing(true);
			};
			if (this.ref && this.ref.onClick) {
				this.ref.onClick();
			};

			keyboard.disableSelection(true);
			win.trigger('resize');
		};

		const setOff = () => {
			keyboard.disableBlur(false);
			keyboard.disableSelection(false);

			if (this.ref && this.ref.onBlur) {
				this.ref.onBlur();
			};
			if (this.ref && this.ref.setEditing) {
				this.ref.setEditing(false);
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
				cellRef: this.ref,
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
					if (this.ref && this.ref.onChange) {
						this.ref.onChange(value);
					};
					this.onChange(value, callBack);
				},
			},
		};

		switch (relation.format) {

			case I.RelationType.Date: {
				param.data = Object.assign(param.data, {
					value: param.data.value || U.Date.now(),
				});
					
				menuId = 'dataviewCalendar';
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
						const value = this.ref?.ref?.getValue();
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
								C.ObjectBookmarkFetch(rootId, value, () => analytics.event('ReloadSourceData'));
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
				if (this.ref.onClick) {
					this.ref.onClick();
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
			pageContainer.off(`mousedown.cell${cellId}`).on(`mousedown.cell${cellId}`, (e: any) => { 
				if (!$(e.target).parents(`#${cellId}`).length) {
					S.Menu.closeAll(J.Menu.cell);
					setOff();

					pageContainer.off(`mousedown.cell${cellId}`);
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
				window.clearTimeout(this.timeout);
			};
		} else {
			setOn();

			if (!canEdit && Relation.isText(relation.format)) {
				bindContainerClick();
			};
		};
	};

	onChange (value: any, callBack?: (message: any) => void) {
		const { onCellChange, recordId, getRecord } = this.props;
		const record = getRecord(recordId);
		const relation = this.getRelation();

		if (!relation) {
			return null;
		};

		value = Relation.formatValue(relation, value, true);
		if (onCellChange) {
			onCellChange(record.id, relation.relationKey, value, callBack);
		};
	};

	onMouseEnter (e: any) {
		const { onMouseEnter, showTooltip, tooltipX, tooltipY, idPrefix, recordId, withName, getRecord } = this.props;
		const record = getRecord(recordId);
		const relation = this.getRelation();
		const cell = $(`#${Relation.cellId(idPrefix, relation.relationKey, record.id)}`);

		if (onMouseEnter) {
			onMouseEnter(e);
		};

		if (showTooltip) {
			const text = !this.checkValue() && withName ? translate(`placeholderCell${relation.format}`) : relation.name;

			Preview.tooltipShow({ text, element: cell, typeX: tooltipX, typeY: tooltipY, delay: 1000 });
		};
	};
	
	onMouseLeave (e: any) {
		const { onMouseLeave } = this.props;

		if (onMouseLeave) {
			onMouseLeave(e);
		};

		Preview.tooltipHide(false);
	};

	getRelation () {
		return S.Record.getRelationByKey(this.props.relationKey);
	};

	canCellEdit (relation: any, record: any): boolean {
		const { readonly } = this.props;
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

});

export default Cell;

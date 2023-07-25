import * as React from 'react';
import $ from 'jquery';
import { observable } from 'mobx';
import { I, C, analytics, UtilCommon, keyboard, Relation, Renderer, Preview, translate } from 'Lib';
import { commonStore, menuStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

import CellText from './text';
import CellSelect from './select';
import CellCheckbox from './checkbox';
import CellObject from './object';
import CellFile from './file';

interface Props extends I.Cell {
	elementId?: string;
	menuClassName?: string;
	menuClassNameWrap?: string;
	showTooltip?: boolean;
	tooltipX?: I.MenuDirection.Left | I.MenuDirection.Center | I.MenuDirection.Right;
	tooltipY?: I.MenuDirection.Top | I.MenuDirection.Bottom;
	maxWidth?: number;
};

class Cell extends React.Component<Props> {

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
		const { elementId, relationKey, recordId, onClick, idPrefix, getRecord } = this.props;
		const relation = this.getRelation();
		const record = getRecord(recordId);

		if (!relation || !record) {
			return null;
		};

		const id = Relation.cellId(idPrefix, relation.relationKey, recordId);
		const canEdit = this.canEdit();

		let check = Relation.checkRelationValue(relation, record[relation.relationKey]);
		if (relation.relationKey == 'name') {
			check = true;
		};

		const cn = [ 
			'cellContent', 
			'c-' + relation.relationKey,
			Relation.className(relation.format), 
			(canEdit ? 'canEdit' : ''), 
			(relationKey == 'name' ? 'isName' : ''),
			(!check ? 'isEmpty' :  ''),
		];

		let CellComponent: any = null;
		switch (relation.format) {
			default:
			case I.RelationType.ShortText:
			case I.RelationType.Number:
			case I.RelationType.LongText:
			case I.RelationType.Date:
				CellComponent = CellText;
				break;

			case I.RelationType.Status:	
			case I.RelationType.Tag:
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
				<CellComponent 
					ref={ref => this.ref = ref} 
					{...this.props} 
					id={id} 
					key={id}
					canEdit={canEdit}
					relation={relation}
					onChange={this.onChange} 
				/>
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
		const relation = this.getRelation();
		if (relation && (relation.format == I.RelationType.ShortText)) {
			const node = $(this.node);
			const icon = node.find('.iconObject');

			icon.length ? node.addClass('withIcon') : node.removeClass('withIcon');
		};
	};

	onClick (e: any) {
		e.stopPropagation();

		const { rootId, subId, block, recordId, getRecord, maxWidth, menuClassName, menuClassNameWrap, idPrefix, pageContainer, bodyContainer, cellPosition, placeholder } = this.props;
		const relation = this.getRelation();
		const record = getRecord(recordId);

		if (!relation || !record) {
			return;
		};

		const { config } = commonStore;
		const cellId = Relation.cellId(idPrefix, relation.relationKey, recordId);
		const value = record[relation.relationKey] || '';

		if (!this.canEdit()) {
			if (Relation.isUrl(relation.format) && value) {
				Renderer.send('urlOpen', Relation.getUrlScheme(relation.format, value) + value);
			};
			return;
		};

		const win = $(window);
		const cell = $(`#${cellId}`);

		let width = cell.outerWidth();
		if (undefined !== maxWidth) {
			width = Math.max(cell.outerWidth(), maxWidth);
		};

		let closeIfOpen = true;
		let menuId = '';
		let setOn = () => {
			cell.addClass('isEditing');

			if (cellPosition) {
				cellPosition(cellId);
			};

			if (menuId) {
				keyboard.disableBlur(true);
			};

			if (this.ref) {
				if (this.ref.setEditing) {
					this.ref.setEditing(true);
				};

				if (this.ref.onClick) {
					this.ref.onClick();
				};
			};

			win.trigger('resize');
		};

		let setOff = () => {
			keyboard.disableBlur(false);

			if (this.ref) {
				if (this.ref.onBlur) {
					this.ref.onBlur();
				};
				if (this.ref.setEditing) {
					this.ref.setEditing(false);
				};
			};

			$(`#${cellId}`).removeClass('isEditing');
			commonStore.cellId = '';
		};

		let ret = false;
		let param: I.MenuParam = { 
			element: `#${cellId} .cellContent`,
			horizontal: I.MenuDirection.Center,
			offsetY: 2,
			noAnimation: true,
			passThrough: true,
			className: menuClassName,
			classNameWrap: menuClassNameWrap,
			onOpen: setOn,
			onClose: setOff,
			data: { 
				cellId,
				cellRef: this.ref,
				rootId,
				subId,
				blockId: block.id,
				value, 
				relation: observable.box(relation),
				record,
				placeholder,
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
					value: param.data.value || UtilCommon.time(),
				});
					
				menuId = 'dataviewCalendar';
				closeIfOpen = false;
				break;
			};

			case I.RelationType.File: {
				param = Object.assign(param, {
					width: width,
				});
				param.data = Object.assign(param.data, {
					value: value || [],
				});

				menuId = 'dataviewFileValues';
				break;
			};

			case I.RelationType.Status: 
			case I.RelationType.Tag: {
				param = Object.assign(param, {
					width: width,
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
					width: width,
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
				const hh = UtilCommon.sizeHeader();
				const height = Math.min(wh - hh - 20, cell.outerHeight());

				param = Object.assign(param, {
					noFlipX: true,
					noFlipY: true,
					element: cell,
					horizontal: I.MenuDirection.Left,
					offsetY: -height,
					width: width,
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
					const scheme = Relation.getUrlScheme(relation.format, value);
					Renderer.send('urlOpen', scheme + value);

					ret = true;
					break;
				};

				let options = [
					{ id: 'go', icon: 'browse', name: translate(`menuDataviewUrlActionGo${relation.format}`) },
					{ id: 'copy', icon: 'copy', name: translate('menuDataviewUrlActionGoCopy') },
				];
				if (relation.relationKey == 'source') {
					options.push({ id: 'reload', icon: 'reload', name: translate('menuDataviewUrlActionGoReload') });
				};

				param.data = Object.assign(param.data, {
					disabled: !value, 
					noFilter: true,
					options,
					onSelect: (event: any, item: any) => {
						let value = '';
						if (this.ref && this.ref.ref) {
							value = this.ref.ref.getValue();
						};

						const scheme = Relation.getUrlScheme(relation.format, value);
						
						if (item.id == 'go') {
							Renderer.send('urlOpen', scheme + value);
							analytics.event('RelationUrlOpen');
						};

						if (item.id == 'copy') {
							UtilCommon.clipboardCopy({ text: value, html: value });
							analytics.event('RelationUrlCopy');
						};

						if (item.id == 'reload') {
							UtilCommon.clipboardCopy({ text: value, html: value });
							C.ObjectBookmarkFetch(rootId, value, () => {
								analytics.event('ReloadSourceData');
							});
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

		if (menuId) {
			if (commonStore.cellId != cellId) {
				commonStore.cellId = cellId;
				
				const isOpen = menuStore.isOpen(menuId);

				menuStore.open(menuId, param);

				// If menu was already open OnOpen callback won't be called
				if (isOpen) {
					setOn();
				};

				$(pageContainer).off('mousedown.cell').on('mousedown.cell', (e: any) => { 
					if (!$(e.target).parents(`#${cellId}`).length) {
						menuStore.closeAll(Constant.menuIds.cell); 
					};
				});

				if (!config.debug.ui) {
					win.off('blur.cell').on('blur.cell', () => { menuStore.closeAll(Constant.menuIds.cell); });
				};
			} else 
			if (closeIfOpen) {
				setOff();
				menuStore.closeAll(Constant.menuIds.cell);
				window.clearTimeout(this.timeout);
			};
		} else {
			setOn();
		};
	};

	onChange (value: any, callBack?: (message: any) => void) {
		const { onCellChange, recordId } = this.props;
		const relation = this.getRelation();

		if (!relation) {
			return null;
		};

		value = Relation.formatValue(relation, value, true);
		if (onCellChange) {
			onCellChange(recordId, relation.relationKey, value, callBack);
		};
	};

	onMouseEnter (e: any) {
		const { onMouseEnter, showTooltip, tooltipX, tooltipY, idPrefix, recordId } = this.props;
		const relation = this.getRelation();
		const cell = $(`#${Relation.cellId(idPrefix, relation.relationKey, recordId)}`);

		if (onMouseEnter) {
			onMouseEnter(e);
		};

		if (showTooltip) {
			Preview.tooltipShow({ text: relation.name, element: cell, typeX: tooltipX, typeY: tooltipY, delay: 1000 });
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
		return dbStore.getRelationByKey(this.props.relationKey);
	};

	canEdit () {
		const { readonly, viewType, getRecord, recordId } = this.props;
		const relation = this.getRelation();
		const record = getRecord(recordId);

		if (!relation || !record || readonly || relation.isReadonlyValue || record.isReadonly) {
			return false;
		};
		if ((record.layout == I.ObjectLayout.Note) && (relation.relationKey == 'name')) {
			return false;
		};
		return true;
	};
	
};

export default Cell;
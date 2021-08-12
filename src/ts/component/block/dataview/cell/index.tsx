import * as React from 'react';
import { I, DataUtil, Util } from 'ts/lib';
import { commonStore, menuStore, dbStore } from 'ts/store';
import { observable } from 'mobx';

import CellText from './text';
import CellSelect from './select';
import CellCheckbox from './checkbox';
import CellObject from './object';
import CellFile from './file';

interface Props extends I.Cell {
	relationKey?: string;
	storeId?: string;
	menuClassName?: string;
	menuClassNameWrap?: string;
	optionCommand?: (code: string, rootId: string, blockId: string, relationKey: string, recordId: string, option: I.SelectOption, callBack?: (message: any) => void) => void;
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

class Cell extends React.Component<Props, {}> {

	public static defaultProps = {
		index: 0,
		canOpen: true,
	};

	ref: any = null;
	timeout: number = 0;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onChange = this.onChange.bind(this);
	};

	render () {
		const { relationKey, index, onClick, onMouseEnter, onMouseLeave, idPrefix } = this.props;
		const relation = this.getRelation();
		if (!relation) {
			return null;
		};

		const canEdit = this.canEdit();
		const cn = [ 
			'cellContent', 
			'c-' + relation.relationKey,
			DataUtil.relationClass(relation.format), 
			(canEdit ? 'canEdit' : ''), 
			(relationKey == Constant.relationKey.name ? 'isName' : ''),
		];

		let CellComponent: React.ReactType<Props>;
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
		
		const id = DataUtil.cellId(idPrefix, relation.relationKey, index);

		return (
			<div className={cn.join(' ')} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
				<CellComponent 
					ref={(ref: any) => { this.ref = ref; }} 
					id={id} 
					key={id}
					{...this.props} 
					canEdit={canEdit}
					relation={relation}
					onChange={this.onChange} 
					onParentClick={this.onClick}
				/>
			</div>
		);
	};

	onClick (e: any) {
		e.stopPropagation();

		const { rootId, block, index, getRecord, menuClassName, menuClassNameWrap, idPrefix, pageContainer, scrollContainer, optionCommand, cellPosition } = this.props;
		const relation = this.getRelation();
		const record = getRecord(index);
		const { config } = commonStore;
		const cellId = DataUtil.cellId(idPrefix, relation.relationKey, index);

		if (!this.canEdit()) {
			return;
		};

		const win = $(window);
		const cell = $(`#${cellId}`);
		const width = Math.max(cell.outerWidth(), Constant.size.dataview.cell.edit);
		const height = cell.outerHeight();
		const value = record[relation.relationKey] || '';

		$('.cell.isEditing').removeClass('isEditing');
		cell.addClass('isEditing');

		if (cellPosition) {
			cellPosition(cellId);
		};

		let menuId = '';
		let setOn = () => {
			if (!this.ref) {
				return;
			};
			if (this.ref.setEditing) {
				this.ref.setEditing(true);
			};
			if (this.ref.onClick) {
				this.ref.onClick();
			};
			if (menuId) {
				$(scrollContainer).addClass('overMenu');
			};

			win.trigger('resize');
		};

		let setOff = () => {
			commonStore.cellId = '';
			cell.removeClass('isEditing');

			if (this.ref && this.ref.setEditing) {
				this.ref.setEditing(false);
			};
			if (menuId) {
				$(scrollContainer).removeClass('overMenu');
			};
		};

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
				rootId: rootId,
				blockId: block.id,
				value: value, 
				relation: observable.box(relation),
				record: record,
				optionCommand: optionCommand,
				onChange: (value: any) => {
					if (this.ref && this.ref.onChange) {
						this.ref.onChange(value);
					};
					this.onChange(value);
				},
			},
		};

		switch (relation.format) {

			case I.RelationType.Date:
				param.data = Object.assign(param.data, {
					value: param.data.value || Util.time(),
				});
					
				menuId = 'dataviewCalendar';
				break;

			case I.RelationType.File:
				param = Object.assign(param, {
					width: width,
				});
				param.data = Object.assign(param.data, {
					value: value || [],
				});

				menuId = 'dataviewFileValues';
				break;

			case I.RelationType.Status:
			case I.RelationType.Tag:
				param = Object.assign(param, {
					width: width,
				});
				param.data = Object.assign(param.data, {
					canAdd: true,
					filter: '',
					value: value || [],
					maxCount: relation.maxCount,
				});

				menuId = (relation.maxCount == 1 ? 'dataviewOptionList' : 'dataviewOptionValues');
				break;
					
			case I.RelationType.Object:
				param = Object.assign(param, {
					width: width,
				});
				param.data = Object.assign(param.data, {
					canAdd: true,
					filter: '',
					value: value || [],
					types: relation.objectTypes,
					maxCount: relation.maxCount,
				});

				menuId = (relation.maxCount == 1 ? 'dataviewObjectList' : 'dataviewObjectValues');
				break;

			case I.RelationType.LongText:
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
				break;

			case I.RelationType.Url:
			case I.RelationType.Email:
			case I.RelationType.Phone:
				param = Object.assign(param, {
					type: I.MenuType.Horizontal,
					width: width,
				});

				let name = 'Go to';
				if (relation.format == I.RelationType.Email) {
					name = 'Mail to';
				};
				if (relation.format == I.RelationType.Phone) {
					name = 'Call to';
				};

				param.data = Object.assign(param.data, {
					disabled: !value, 
					options: [
						{ id: 'go', name: name },
						{ id: 'copy', name: 'Copy' },
					],
					onSelect: (event: any, item: any) => {
						let value = '';
						let scheme = '';

						if (this.ref) {
							value = this.ref.ref.getValue();
						};

						if (relation.format == I.RelationType.Url) {
							if (!value.match(/:\/\//)) {
								scheme = 'http://';
							};
						};
						if (relation.format == I.RelationType.Email) {
							scheme = 'mailto:';
						};
						if (relation.format == I.RelationType.Phone) {
							scheme = 'tel:';
						};

						if (item.id == 'go') {
							ipcRenderer.send('urlOpen', scheme + value);
						};

						if (item.id == 'copy') {
							Util.clipboardCopy({ text: value, html: value });
						};
					},
				});

				menuId = 'button';
				break;
					
			case I.RelationType.Checkbox:
				cell.removeClass('isEditing');
				break; 
		};

		if (menuId) {
			menuStore.closeAll(Constant.menuIds.cell);
			window.clearTimeout(this.timeout);

			if (commonStore.cellId != cellId) {
				commonStore.cellId = cellId;

				this.timeout = window.setTimeout(() => {
					menuStore.open(menuId, param);

					$(pageContainer).unbind('click').on('click', () => { menuStore.closeAll(Constant.menuIds.cell); });
					if (!config.debug.ui) {
						win.unbind('blur.cell').on('blur.cell', () => { menuStore.closeAll(Constant.menuIds.cell); });
					};
				}, Constant.delay.menu);
			};
		} else {
			setOn();
		};
	};

	onChange (value: any, callBack?: (message: any) => void) {
		const { onCellChange, index, getRecord } = this.props;
		const relation = this.getRelation();
		if (!relation) {
			return null;
		};

		const record = getRecord(index);
		if (record && onCellChange) {
			onCellChange(record.id, relation.relationKey, DataUtil.formatRelationValue(relation, value, true), callBack);
		};
	};

	getRelation () {
		const { rootId, storeId, relation, block, relationKey } = this.props;
		return relation ? relation : dbStore.getRelation(rootId, (storeId || block.id), relationKey);
	};

	canEdit () {
		const { readonly, viewType, getRecord, index } = this.props;
		const relation = this.getRelation();
		const record = getRecord(index);

		if (!relation || readonly || relation.isReadonlyValue || record.isReadonly) {
			return false;
		};
		if (relation.format == I.RelationType.Checkbox) {
			return true;
		};
		return (viewType == I.ViewType.Grid);
	};
	
};

export default Cell;
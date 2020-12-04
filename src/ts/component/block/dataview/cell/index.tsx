import * as React from 'react';
import { I, DataUtil, Util } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
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
};

const $ = require('jquery');
const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

class Cell extends React.Component<Props, {}> {

	public static defaultProps = {
		index: 0,
	};

	ref: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onChange = this.onChange.bind(this);
	};

	render () {
		const { relationKey, index, onClick, idPrefix } = this.props;
		const relation = this.getRelation();
		if (!relation) {
			return null;
		};

		const { format, isReadOnly } = relation;
		const cn = [ 
			'cellContent', 
			'c-' + DataUtil.relationClass(format), 
			(!isReadOnly ? 'canEdit' : ''), 
			(relationKey == 'name' ? 'isName' : ''),
		];

		let CellComponent: React.ReactType<Props>;
		switch (format) {
			default:
			case I.RelationType.Title:
			case I.RelationType.Number:
			case I.RelationType.Description:
			case I.RelationType.Date:
				CellComponent = CellText;
				break;
				
			case I.RelationType.Select:
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
			<div className={cn.join(' ')} onClick={onClick}>
				<CellComponent 
					ref={(ref: any) => { this.ref = ref; }} 
					id={DataUtil.cellId(idPrefix, relation.relationKey, index)} 
					{...this.props} 
					relation={relation}
					onChange={this.onChange} 
				/>
			</div>
		);
	};

	onClick (e: any) {
		e.stopPropagation();

		const { rootId, block, index, getRecord, readOnly, menuClassName, idPrefix } = this.props;
		const relation = this.getRelation();

		if (!relation || readOnly || relation.isReadOnly) {
			return;
		};

		if (this.ref && this.ref.canEdit) {
			if (!this.ref.canEdit()) {
				return;
			};
		};

		const id = DataUtil.cellId(idPrefix, relation.relationKey, index);
		const cell = $('#' + id);
		const element = cell.find('.cellContent');
		const width = Math.max(element.outerWidth(), Constant.size.dataview.cell.edit);
		const height = cell.outerHeight();
		const record = getRecord(index);
		const value = record[relation.relationKey] || '';
		const page = $('.pageMainEdit');
		const setOn = () => {
			if (!this.ref) {
				return;
			};
			if (this.ref.setEditing) {
				this.ref.setEditing(true);
			};
			if (this.ref.onClick) {
				this.ref.onClick();
			};
		};

		let menuId = '';
		let param: I.MenuParam = { 
			element: element,
			offsetX: 0,
			offsetY: 0,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Left,
			noAnimation: true,
			noFlip: true,
			className: menuClassName,
			onOpen: setOn,
			onClose: () => {
				cell.removeClass('isEditing');
				if (this.ref && this.ref.setEditing) {
					this.ref.setEditing(false);
				};
			},
			data: { 
				rootId: rootId,
				blockId: block.id,
				value: value, 
				relation: observable.box(relation),
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
				param = Object.assign(param, {
					offsetY: 14,
				});
				param.data = Object.assign(param.data, {
					value: param.data.value || Util.time(),
				});
					
				menuId = 'dataviewCalendar';
				break;

			case I.RelationType.File:
				if (!value.length) {
					break;
				};

				param = Object.assign(param, {
					element: cell,
					offsetY: -height + 1,
					width: width,
				});
				param.data = Object.assign(param.data, {
					value: value || [],
				});

				menuId = 'dataviewMedia';
				break;
					
			case I.RelationType.Select:
				param = Object.assign(param, {
					width: Math.max(Constant.size.menuDataviewOptionList, width),
					passThrough: true,
				});

				param.data = Object.assign(param.data, {
					filter: '',
					value: value || [],
				});

				menuId = 'dataviewOptionList';
				break;
					
			case I.RelationType.Object:
				param = Object.assign(param, {
					width: width,
				});
				param.data = Object.assign(param.data, {
					filter: '',
					value: value || [],
					types: relation.objectTypes,
				});

				menuId = 'dataviewObjectList';
				break;

			case I.RelationType.Description:
				param = Object.assign(param, {
					element: cell,
					offsetY: -height,
					width: width,
				});
				menuId = 'dataviewText';
				break;
			case I.RelationType.Url:
			case I.RelationType.Email:
			case I.RelationType.Phone:
				if (!value) {
					break;
				};

				param = Object.assign(param, {
					type: I.MenuType.Horizontal,
					horizontal: I.MenuDirection.Center,
					className: 'button',
					passThrough: true,
					width: width,
					offsetY: 14,
				});

				let name = 'Go to';
				if (relation.format == I.RelationType.Email) {
					name = 'Mail to';
				};
				if (relation.format == I.RelationType.Phone) {
					name = 'Call to';
				};

				param.data = Object.assign(param.data, {
					value: '',
					noKeys: true,
					options: [
						{ id: 'go', name: name },
						{ id: 'copy', name: 'Copy' },
					],
					onSelect: (event: any, item: any) => {
						let scheme = '';
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

				menuId = 'select';
				break;
					
			case I.RelationType.Checkbox:
				break; 
		};

		if (menuId) {
			commonStore.menuCloseAll([ 
				'select', 
				'dataviewText', 
				'dataviewObjectList', 
				'dataviewOptionList', 
				'dataviewMedia', 
				'dataviewCalendar',
			]);
			commonStore.menuOpen(menuId, param); 
			
			page.unbind('click').on('click', () => {
				commonStore.menuCloseAll();
			});
		} else {
			setOn();
		};
	};

	onChange (value: any) {
		const { onCellChange, index, getRecord } = this.props;
		const relation = this.getRelation();
		if (!relation) {
			return null;
		};

		const record = getRecord(index);
		if (onCellChange) {
			onCellChange(record.id, relation.relationKey, value);
		};
	};

	getRelation () {
		const { storeId, relation, block, relationKey } = this.props;
		return relation ? relation : dbStore.getRelation(storeId || block.id, relationKey);
	};
	
};

export default Cell;
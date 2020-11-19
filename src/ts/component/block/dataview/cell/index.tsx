import * as React from 'react';
import { I, C, DataUtil, Util } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import CellText from './text';
import CellSelect from './select';
import CellBool from './checkbox';
import CellObject from './object';
import CellMedia from './media';

interface Props extends I.Cell {};

const $ = require('jquery');
const Constant = require('json/constant.json');
const { ipcRenderer } = window.require('electron');

@observer
class Cell extends React.Component<Props, {}> {

	ref: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
		this.onChange = this.onChange.bind(this);
	};

	render () {
		const { id, relation, data, readOnly } = this.props;
		
		let cn = [ 'cellContent', 'c-' + DataUtil.relationClass(relation.format), (!readOnly ? 'canEdit' : '') ];
		let CellComponent: React.ReactType<Props>;

		switch (relation.format) {
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
				CellComponent = CellBool;
				break;

			case I.RelationType.File:
			case I.RelationType.Media:
				CellComponent = CellMedia;
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
			<div className={cn.join(' ')}>
				<CellComponent ref={(ref: any) => { this.ref = ref; }} {...this.props} data={data} onChange={this.onChange} />
			</div>
		);
	};

	onClick (e: any) {
		e.stopPropagation();

		const { id, relation, rootId, block, index, readOnly, data } = this.props;

		if (readOnly || relation.isReadOnly) {
			return;
		};

		const cellId = DataUtil.cellId('cell', relation.key, id);
		const cell = $('#' + cellId);
		const width = Math.max(cell.outerWidth(), Constant.size.dataview.cell.default);
		const item = data[index] || {};
		const value = item[relation.key] || '';
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
			element: '#' + cellId,
			offsetX: 0,
			offsetY: 0,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			noAnimation: true,
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
					if (this.ref.onChange) {
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
			case I.RelationType.Media:
				if (!value) {
					break;
				};
				
				param = Object.assign(param, {
					width: width,
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
				menuId = 'dataviewObjectList';
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
			commonStore.menuCloseAll();
			commonStore.menuOpen(menuId, param); 
			
			page.unbind('click').on('click', () => {
				commonStore.menuCloseAll();
			});
		} else {
			setOn();
		};
	};

	onChange (value: any) {
		const { relation, onCellChange, data, index } = this.props;

		if (onCellChange) {
			onCellChange(data[index].id, relation.key, value);
		};
	};
	
};

export default Cell;
import * as React from 'react';
import { I, C, DataUtil, Util } from 'ts/lib';
import { commonStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

import CellText from './text';
import CellSelect from './select';
import CellBool from './checkbox';
import CellLink from './link';

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
		const { id, relation, data, readOnly, view } = this.props;
		
		let cn = [ 'cellContent', 'c-' + relation.type, (!readOnly ? 'canEdit' : '') ];
		let CellComponent: React.ReactType<Props>;

		switch (relation.type) {
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
				
			case I.RelationType.Link:
				CellComponent = CellLink;
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
		const { id, relation, index, readOnly } = this.props;
		const data = this.props.data[index];

		if (readOnly || relation.isReadOnly) {
			return;
		};

		const cellId = DataUtil.cellId('cell', relation.id, id);
		const cell = $('#' + cellId);
		const width = Math.max(cell.width(), Constant.size.dataview.cell.default);
		const value = data[relation.id];

		if (this.ref) {
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
			offsetY: 4,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			onClose: () => {
				cell.removeClass('isEditing');
				if (this.ref && this.ref.setEditing) {
					this.ref.setEditing(false);
				};
			},
			data: { 
				value: value, 
				values: relation.values 
			},
		};

		switch (relation.type) {

			case I.RelationType.Date:
				param.data = Object.assign(param.data, {
					value: param.data.value || Util.time(),
					onChange: (value: number) => {
						this.onChange(value);
					},
				});
					
				menuId = 'dataviewCalendar';
				break;
					
			case I.RelationType.Select:
				menuId = 'dataviewTagList';
				break;
					
			case I.RelationType.Link:
				menuId = 'dataviewAccount';
				break;

			case I.RelationType.Url:
			case I.RelationType.Email:
			case I.RelationType.Phone:
				if (!value) {
					break;
				};

				param = Object.assign(param, {
					type: I.MenuType.Horizontal,
					horizontal: I.MenuDirection.Left,
					className: 'button',
					passThrough: true,
					width: width,
				});

				param.data = Object.assign(param.data, {
					value: '',
					noKeys: true,
					options: [
						{ id: 'go', name: 'Go to' },
						{ id: 'copy', name: 'Copy' },
					],
					onSelect: (event: any, item: any) => {
						let scheme = '';
						if (relation.type == I.RelationType.Email) {
							scheme = 'mailto:';
						};
						if (relation.type == I.RelationType.Phone) {
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
			window.setTimeout(() => { commonStore.menuOpen(menuId, param); }, Constant.delay.menu);
		};
	};

	onChange (value: any) {
		const { rootId, block, index, relation } = this.props;
		const data = this.props.data[index];

		if (data[relation.id] === value) {
			return;
		};

		let obj = { id: data.id };
		obj[relation.id] = value;

		dbStore.updateRecord(block.id, obj);
		C.BlockUpdateDataviewRecord(rootId, block.id, data.id, data);
	};
	
};

export default Cell;
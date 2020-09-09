import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I, C, DataUtil, Util } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';
import { observable } from 'mobx';

import CellText from './text';
import CellDate from './date';
import CellSelect from './select';
import CellBool from './checkbox';
import CellLink from './link';

interface Props extends I.Cell {};

const $ = require('jquery');
const Constant = require('json/constant.json');

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
		
		let cn = [ 'cellContent', 'c-' + relation.type, (!readOnly ? 'canEdit' : '') ];
		let CellComponent: React.ReactType<Props>;
		
		switch (relation.type) {
			default:
			case I.RelationType.Title:
			case I.RelationType.Number:
			case I.RelationType.Description:
				CellComponent = CellText;
				break;
				
			case I.RelationType.Date:
				CellComponent = CellDate;
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
				<CellComponent ref={(ref: any) => { this.ref = ref; }} {...this.props} data={data || {}} onChange={this.onChange} />
			</div>
		);
	};

	componentDidUpdate () {
		console.log('UPDATE');
	};
	
	onClick (e: any) {
		const { id, relation, data, readOnly } = this.props;

		if (readOnly || relation.isReadOnly) {
			return;
		};

		const cellId = DataUtil.cellId('cell', relation.id, id);
		const cell = $('#' + cellId);

		cell.addClass('isEditing');
		if (this.ref && this.ref.setEditing) {
			this.ref.setEditing(true);
		};
		
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
				value: data[relation.id], 
				values: relation.values 
			},
		};

		commonStore.menuCloseAll();
		window.setTimeout(() => {
			switch (relation.type) {

				case I.RelationType.Date:
					param.data.onChange = (value: number) => {
						this.onChange(value);
					};
					
					commonStore.menuOpen('dataviewCalendar', param);
					break;
					
				case I.RelationType.Select:
					commonStore.menuOpen('dataviewTagList', param);
					break;
					
				case I.RelationType.Link:
					commonStore.menuOpen('dataviewAccount', param);
					break;
					
				case I.RelationType.Checkbox:
					break; 
			};
		}, Constant.delay.menu);
	};

	onChange (value: any) {
		let { id, rootId, block, data, relation } = this.props;
		
		if (data[relation.id] === value) {
			return;
		};
		
		data = Util.objectCopy(data);
		data[relation.id] = value;

		block.content.data[id] = observable(data);
		C.BlockUpdateDataviewRecord(rootId, block.id, data.id, data);
	};
	
};

export default Cell;
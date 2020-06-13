import * as React from 'react';
import { I, DataUtil } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

import CellText from './text';
import CellDate from './date';
import CellLink from './link';
import CellSelect from './select';
import CellBool from './checkbox';
import CellAccount from './account';

interface Props extends I.Cell {};

@observer
class Cell extends React.Component<Props, {}> {

	ref: any = null;
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
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
				CellComponent = CellAccount;
				break;
				
			case I.RelationType.Url:
			case I.RelationType.Email:
			case I.RelationType.Phone:
				CellComponent = CellLink;
				break;
		};
		
		return (
			<div className={cn.join(' ')} onClick={this.onClick}>
				<CellComponent ref={(ref: any) => { this.ref = ref; }} {...this.props} data={data || {}} />
			</div>
		);
	};
	
	onClick (e: any) {
		const { id, relation, data, readOnly } = this.props;
		
		if (readOnly) {
			return;
		};

		if (this.ref.onClick) {
			this.ref.onClick(e);
		};
		
		let element = '#' + DataUtil.cellId(relation.id, id);
		let param: I.MenuParam = { 
			element: element,
			offsetX: 0,
			offsetY: 4,
			type: I.MenuType.Vertical,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: { 
				value: data[relation.id], 
				values: relation.values 
			},
		};
		
		switch (relation.type) {
			case I.RelationType.Date:
				param.data.onChange = (value: number) => {
					console.log('value', value); 
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
	};
	
};

export default Cell;
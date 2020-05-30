import * as React from 'react';
import { I } from 'ts/lib';
import { commonStore } from 'ts/store';
import { observer } from 'mobx-react';

import CellText from './text';
import CellDate from './date';
import CellLink from './link';
import CellSelect from './select';
import CellMultiple from './multiple';
import CellBool from './bool';
import CellAccount from './account';

interface Props extends I.Cell {};

@observer
class Cell extends React.Component<Props, {}> {
	
	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { id, relation, data } = this.props;
		
		let CellComponent: React.ReactType<Props>;
		switch (relation.type) {
			default:
			case I.RelationType.Text:
			case I.RelationType.Title:
			case I.RelationType.Number:
				CellComponent = CellText;
				break;
				
			case I.RelationType.Date:
				CellComponent = CellDate;
				break;
				
			case I.RelationType.Select:
				CellComponent = CellSelect;
				break;
				
			case I.RelationType.Multiple:
				CellComponent = CellMultiple;
				break;
				
			case I.RelationType.Bool:
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
			<div id={[ 'cell', relation.id, id ].join('-')} className={[ 'cellContent', 'c-' + relation.type ].join(' ')} onClick={this.onClick}>
				<CellComponent {...this.props} data={data || {}} />
			</div>
		);
	};
	
	onClick () {
		const { id, relation, data } = this.props;
		const element = '#' + [ 'cell', relation.id, id ].join('-');
		
		let param: any = { 
			element: element,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: { 
				value: data, 
				values: relation.values 
			}
		};
		
		switch (relation.type) {
			case I.RelationType.Date:
				param.data.onChange = (value: number) => {
					console.log('value', value); 
				};
				
				commonStore.menuOpen('dataviewCalendar', param);
				break;
				
			case I.RelationType.Select:
			case I.RelationType.Multiple:
				commonStore.menuOpen('dataviewTagList', param);
				break;
				
			case I.RelationType.Link:
				commonStore.menuOpen('dataviewAccount', param);
				break;
				
			case I.RelationType.Bool:
				break; 
		};
	};
	
};

export default Cell;
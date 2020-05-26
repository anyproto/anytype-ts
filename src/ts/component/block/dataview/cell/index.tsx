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
		const { id, property } = this.props;
		
		let CellComponent: React.ReactType<{}>;
		
		switch (property.type) {
			default:
			case I.PropertyType.Text:
			case I.PropertyType.Title:
			case I.PropertyType.Number:
				CellComponent = CellText;
				break;
				
			case I.PropertyType.Date:
				CellComponent = CellDate;
				break;
				
			case I.PropertyType.Select:
				CellComponent = CellSelect;
				break;
				
			case I.PropertyType.Multiple:
				CellComponent = CellMultiple;
				break;
				
			case I.PropertyType.Bool:
				CellComponent = CellBool;
				break;
				
			case I.PropertyType.Link:
				CellComponent = CellAccount;
				break;
				
			case I.PropertyType.Url:
			case I.PropertyType.Email:
			case I.PropertyType.Phone:
				CellComponent = CellLink;
				break;
		};
		
		return (
			<div id={[ 'cell', property.id, id ].join('-')} className={'cell c' + property.type} onClick={this.onClick}>
				<CellComponent {...this.props} />
			</div>
		);
	};
	
	onClick () {
		const { id, property, data } = this.props;
		const element = '#' + [ 'cell', property.id, id ].join('-');
		
		let param: any = { 
			element: element,
			offsetY: 4,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: { 
				value: data, 
				values: property.values 
			}
		};
		
		switch (property.type) {
			case I.PropertyType.Date:
				param.data.onChange = (value: number) => {
					console.log('value', value); 
				};
				
				commonStore.menuOpen('dataviewCalendar', param);
				break;
				
			case I.PropertyType.Select:
			case I.PropertyType.Multiple:
				commonStore.menuOpen('dataviewTagList', param);
				break;
				
			case I.PropertyType.Link:
				commonStore.menuOpen('dataviewAccount', param);
				break;
				
			case I.PropertyType.Bool:
				break; 
		};
	};
	
};

export default Cell;
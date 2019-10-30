import * as React from 'react';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

import CellText from './text';
import CellDate from './date';
import CellLink from './link';
import CellSelect from './select';
import CellMultiple from './multiple';
import CellBool from './bool';

interface Props extends I.Cell {
	commonStore?: any;
};

@inject('commonStore')
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
		const { commonStore, id, property, data } = this.props;
		const element = [ 'cell', property.id, id ].join('-');
		
		let param: any = { 
			element: element,
			offsetY: 4,
			light: true,
			vertical: I.MenuDirection.Bottom,
			horizontal: I.MenuDirection.Center,
			data: { value: data }
		};
		
		switch (property.type) {
			case I.PropertyType.Date:
				param.data.onChange = (value: number) => {
					console.log('value', value); 
				};
				
				commonStore.menuOpen('calendar', param);
				break;
				
			case I.PropertyType.Select:
			case I.PropertyType.Multiple:
				param.data.values = property.values;
			
				commonStore.menuOpen('tag', param);
				break;
				
			case I.PropertyType.Bool:
				break; 
		};
	};
	
};

export default Cell;
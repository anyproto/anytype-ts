import * as React from 'react';
import { I } from 'ts/lib';
import { observer, inject } from 'mobx-react';

import CellText from './text';
import CellDate from './date';
import CellLink from './link';
import CellSelect from './select';
import CellMultiple from './multiple';

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
		
		switch (property.type) {
			case I.PropertyType.Date:
				commonStore.menuOpen('calendar', { 
					element: [ 'cell', property.id, id ].join('-'),
					offsetY: 4,
					light: true,
					vertical: I.MenuDirection.Bottom,
					horizontal: I.MenuDirection.Center,
					data: {
						value: data,
						onChange: (value: number) => { console.log('value', value); }
					}
				});
				break;
		};
	};
	
};

export default Cell;
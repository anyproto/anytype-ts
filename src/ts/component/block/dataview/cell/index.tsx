import * as React from 'react';
import { I } from 'ts/lib';

import CellText from './text';
import CellDate from './date';
import CellLink from './link';
import CellSelect from './select';
import CellMultiple from './multiple';

interface Props extends I.Cell {};

class Cell extends React.Component<Props, {}> {

	render () {
		const { property } = this.props;
		
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
			<div className={'cell c' + property.type}>
				<CellComponent {...this.props} />
			</div>
		);
	};
	
};

export default Cell;
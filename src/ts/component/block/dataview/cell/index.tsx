import * as React from 'react';
import { I } from 'ts/lib';

import CellText from './text';
import CellDate from './date';

interface Props {
	property: I.Property;
	data: any;
};

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
		};
		
		return (
			<React.Fragment>
				<CellComponent {...this.props} />
			</React.Fragment>
		);
	};
	
};

export default Cell;
import * as React from 'react';
import { I } from 'ts/lib';

interface Props {
	property: I.Property;
	data: any;
};

class CellText extends React.Component<Props, {}> {

	render () {
		const { data } = this.props;
		
		return (
			<React.Fragment>
				{data}
			</React.Fragment>
		);
	};
	
};

export default CellText;
import * as React from 'react';
import { I, Util } from 'ts/lib';

interface Props {
	property: I.Property;
	data: any;
};

class CellText extends React.Component<Props, {}> {

	render () {
		const { data } = this.props;
		const format = 'M d, Y';
		
		return (
			<React.Fragment>
				{Util.date(format, data)}
			</React.Fragment>
		);
	};
	
};

export default CellText;
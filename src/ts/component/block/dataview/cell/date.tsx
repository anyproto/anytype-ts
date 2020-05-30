import * as React from 'react';
import { I, Util } from 'ts/lib';

interface Props extends I.Cell {};

class CellDate extends React.Component<Props, {}> {

	render () {
		const { relation, data } = this.props;
		const format = 'M d, Y';
		
		return (
			<React.Fragment>
				{Util.date(format, data[relation.id])}
			</React.Fragment>
		);
	};
	
};

export default CellDate;
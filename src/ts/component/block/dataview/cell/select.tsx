import * as React from 'react';
import { Tag } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.Cell {};

class CellSelect extends React.Component<Props, {}> {

	render () {
		const { data } = this.props;
		
		return (
			<Tag text={data} />
		);
	};
	
};

export default CellSelect;
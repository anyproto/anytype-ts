import * as React from 'react';
import { Tag } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.Cell {};

class CellSelect extends React.Component<Props, {}> {

	render () {
		const { data, relation } = this.props;
		
		return (
			<Tag text={data[relation.id]} />
		);
	};
	
};

export default CellSelect;
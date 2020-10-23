import * as React from 'react';
import { Tag } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};

@observer
class CellSelect extends React.Component<Props, {}> {

	render () {
		const { index, relation } = this.props;
		const data = this.props.data[index];
		
		return (
			<Tag text={data[relation.key]} />
		);
	};
	
};

export default CellSelect;
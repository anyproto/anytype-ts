import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.Cell {};

class CellCheckbox extends React.Component<Props, {}> {

	render () {
		const { relation, data } = this.props;

		return (
			<React.Fragment>
				<Icon className={'checkbox ' + (data[relation.id] ? 'active' : '')} />
			</React.Fragment>
		);
	};
	
};

export default CellCheckbox;
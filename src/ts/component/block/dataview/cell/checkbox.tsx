import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';

interface Props extends I.Cell {};

class CellCheckbox extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { relation, data } = this.props;

		return (
			<React.Fragment>
				<Icon className={'checkbox ' + (data[relation.id] ? 'active' : '')} />
			</React.Fragment>
		);
	};

	onClick () {
		const { relation, data, onChange } = this.props;

		if (onChange) {
			onChange(!data[relation.id]);
		};
	};
	
};

export default CellCheckbox;
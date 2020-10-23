import * as React from 'react';
import { Icon } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};

@observer
class CellCheckbox extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { relation, index } = this.props;
		const data = this.props.data[index];

		return (
			<React.Fragment>
				<Icon className={'checkbox ' + (data[relation.key] ? 'active' : '')} />
			</React.Fragment>
		);
	};

	onClick () {
		const { relation, index, onChange } = this.props;
		const data = this.props.data[index];

		if (onChange) {
			onChange(!data[relation.key]);
		};
	};
	
};

export default CellCheckbox;
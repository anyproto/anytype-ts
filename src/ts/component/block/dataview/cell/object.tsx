import * as React from 'react';
import { IconUser } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};

@observer
class CellObject extends React.Component<Props, {}> {

	render () {
		const { relation, index, getRecord } = this.props;
		const record = getRecord(index);
		const value = record[relation.key] || [];

		if (!value.length) {
			return null;
		};

		return (
			<React.Fragment>
			</React.Fragment>
		);
	};
	
};

export default CellObject;
import * as React from 'react';
import { IconUser } from 'ts/component';
import { I, Util } from 'ts/lib';
import { null } from 'is';

interface Props extends I.Cell {};

class CellAccount extends React.Component<Props, {}> {

	render () {
		let { relation, data } = this.props;
		
		if (!data[relation.id]) {
			return null;
		};
		
		return (
			<React.Fragment>
				<IconUser className="c18" {...data[relation.id]} />
				{data[relation.id].name}
			</React.Fragment>
		);
	};
	
};

export default CellAccount;
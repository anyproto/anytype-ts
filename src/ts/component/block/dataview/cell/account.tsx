import * as React from 'react';
import { IconUser } from 'ts/component';
import { I, Util } from 'ts/lib';

interface Props extends I.Cell {};

class CellAccount extends React.Component<Props, {}> {

	render () {
		let { property, data } = this.props;
		
		if (!data) {
			return <React.Fragment />;
		};
		
		return (
			<React.Fragment>
				<IconUser className="c18" {...data} />
				{data.name}
			</React.Fragment>
		);
	};
	
};

export default CellAccount;
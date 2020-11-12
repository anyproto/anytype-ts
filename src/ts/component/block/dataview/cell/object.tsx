import * as React from 'react';
import { IconUser } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};

@observer
class CellObject extends React.Component<Props, {}> {

	render () {
		const { relation, index } = this.props;
		const data = this.props.data[index][relation.key];

		if (!data) {
			return null;
		};
		
		return (
			<React.Fragment>
				<IconUser className="c18" {...data} />
				{data.name}
			</React.Fragment>
		);
	};
	
};

export default CellObject;
import * as React from 'react';
import { IconUser } from 'ts/component';
import { I } from 'ts/lib';
import { observer } from 'mobx-react';

interface Props extends I.Cell {};

@observer
class CellLink extends React.Component<Props, {}> {

	render () {
		const { relation, index } = this.props;
		const data = this.props.data[index];
		
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

export default CellLink;
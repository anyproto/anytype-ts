import * as React from 'react';
import { I } from 'ts/lib';
import { Smile } from 'ts/component';

interface Props extends I.Cell {};

class CellText extends React.Component<Props, {}> {

	render () {
		const { data, relation } = this.props;

		let icon = null;
		if (relation.id == 'name') {
			icon = (
				<React.Fragment>
					<Smile icon={data.iconEmoji} hash={data.iconImage} />&nbsp;
				</React.Fragment>
			);
		};

		return (
			<React.Fragment>
				{icon}{data[relation.id]}
			</React.Fragment>
		);
	};
	
};

export default CellText;
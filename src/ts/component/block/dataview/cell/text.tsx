import * as React from 'react';
import { I } from 'ts/lib';
import { Smile } from 'ts/component';

interface Props extends I.Cell {};

class CellText extends React.Component<Props, {}> {

	render () {
		const { data, relation, view } = this.props;

		let icon = null;
		if (relation.id == 'name') {
			let cn = 'c20';
			let size = 18;

			switch (view.type) {
				case I.ViewType.List:
					cn = 'c24';
					break;
				case I.ViewType.Gallery:
					cn = 'c48';
					size = 24;
					break;
			};

			icon = (
				<React.Fragment>
					<Smile icon={data.iconEmoji} hash={data.iconImage} className={cn} size={size} />&nbsp;
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
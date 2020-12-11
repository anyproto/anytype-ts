import * as React from 'react';
import { IconEmoji } from 'ts/component';

interface Props {
	icon?: string;
};

class ContentIcon extends React.Component<Props, {}> {

	render () {
		const { icon } = this.props;
		return (
			<IconEmoji size={32} icon={icon} className="c64" />
		);
	};
	
};

export default ContentIcon;
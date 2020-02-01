import * as React from 'react';
import { Smile } from 'ts/component';

interface Props {
	icon?: string;
};

class ContentIcon extends React.Component<Props, {}> {

	render () {
		const { icon } = this.props;
		
		return (
			<Smile size={32} icon={icon} className="c64" />
		);
	};
	
};

export default ContentIcon;
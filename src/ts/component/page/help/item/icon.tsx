import * as React from 'react';
import { Smile } from 'ts/component';

interface Props {
	icon?: string;
};

class ContentIcon extends React.Component<Props, {}> {

	render () {
		const { icon } = this.props;
		
		return (
			<Smile size={24} icon={icon} className="c48" />
		);
	};
	
};

export default ContentIcon;
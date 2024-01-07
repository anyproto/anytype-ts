/** @format */

import * as React from 'react';
import { IconObject } from 'Component';

interface Props {
	icon?: string;
}

class ContentIcon extends React.Component<Props> {
	render() {
		const { icon } = this.props;
		return <IconObject size={96} object={{ iconEmoji: icon }} />;
	}
}

export default ContentIcon;

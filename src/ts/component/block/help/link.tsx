import * as React from 'react';
import { IconObject } from 'Component';
import { UtilRouter } from 'Lib';

interface Props {
	icon?: string;
	name?: string;
	contentId?: string;
};

class ContentLink extends React.Component<Props> {

	constructor (props: Props) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { icon, name } = this.props;
		
		return (
			<React.Fragment>
				<IconObject object={{ iconEmoji: icon }} />
				<div className="name" onClick={this.onClick}>{name}</div>
			</React.Fragment>
		);
	};
	
	onClick (e: any) {
		UtilRouter.go(`/help/${this.props.contentId}`, {});
	};
	
};

export default ContentLink;
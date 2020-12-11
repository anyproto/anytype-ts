import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconEmoji } from 'ts/component';

interface Props extends RouteComponentProps<any> {
	icon?: string;
	name?: string;
	contentId?: string;
};

class ContentLink extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { icon, name } = this.props;
		
		return (
			<React.Fragment>
				<IconEmoji icon={icon} />
				<div className="name" onClick={this.onClick}>{name}</div>
			</React.Fragment>
		);
	};
	
	onClick (e: any) {
		const { history, contentId } = this.props;
		
		history.push('/help/' + contentId);
	};
	
};

export default ContentLink;
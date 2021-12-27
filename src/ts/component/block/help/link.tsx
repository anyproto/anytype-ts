import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { IconObject } from 'ts/component';
import { Util } from 'ts/lib';

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
				<IconObject object={{ iconEmoji: icon }} />
				<div className="name" onClick={this.onClick}>{name}</div>
			</React.Fragment>
		);
	};
	
	onClick (e: any) {
		const { contentId } = this.props;
		
		Util.route('/help/' + contentId);
	};
	
};

export default ContentLink;
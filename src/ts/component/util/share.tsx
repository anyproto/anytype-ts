import * as React from 'react';
import $ from 'jquery';
import { Icon, Label } from 'Component';
import { S, U, translate, analytics, I } from 'Lib'

class Share extends React.Component<{}, {}> {

	node: any = null;

	constructor (props) {
		super(props);

		this.onClick = this.onClick.bind(this);
	}

	render () {
		return (
			<div
				ref={ref => this.node = ref}
				id="shareTooltip"
				className="shareTooltip"
				onClick={this.onClick}
			>
				<Icon className="close" onClick={this.onClose} />
				<Icon className="smile" />
				<Label text={translate('shareTooltipLabel')} />
			</div>
		);
	};

	onClick () {
		S.Popup.open('share', {});
		
		analytics.event('ClickShareApp', { route: $(this.node).hasClass('canClose') ? 'Onboarding' : 'Help' });

		U.Common.shareTooltipHide();
	};

	onClose (e) {
		e.preventDefault();
		e.stopPropagation();

		U.Common.shareTooltipHide();
	};

};

export default Share;

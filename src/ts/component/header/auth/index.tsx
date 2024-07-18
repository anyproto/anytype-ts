import * as React from 'react';
import { Icon } from 'Component';
import { S } from 'Lib';

class HeaderAuthIndex extends React.Component {
	
	constructor (props: any) {
		super(props);

		this.onSettings = this.onSettings.bind(this);
	};

	render () {
		return (
			<React.Fragment>
				<div className="side left" />
				<div className="side center" />
				<div className="side right">
					<Icon className="settings" onClick={this.onSettings} />
				</div>
			</React.Fragment>
		);
	};

	onSettings () {
		S.Popup.open('settingsOnboarding', {});
	};
	
};

export default HeaderAuthIndex;
import * as React from 'react';
import { Icon } from 'Component';
import { popupStore } from 'Store';

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
		popupStore.open('settingsOnboarding', {});
	};
	
};

export default HeaderAuthIndex;
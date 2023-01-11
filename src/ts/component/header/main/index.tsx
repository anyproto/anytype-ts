import * as React from 'react';
import { I, DataUtil } from 'Lib';
import { Icon } from 'Component';
import { popupStore } from 'Store';
import { observer } from 'mobx-react';

const HeaderMainIndex = observer(class HeaderMainIndex extends React.Component<I.HeaderComponent> {
	
	constructor (props: I.HeaderComponent) {
		super(props);
		
		this.onSettings = this.onSettings.bind(this);
	};

	render () {
		const { onSearch } = this.props;

		return (
			<React.Fragment>
				<div className="side left" />

				<div className="side center" onClick={onSearch}>
					<div id="path" className="path">Search for an object</div>
				</div>

				<div className="side right">
					<Icon tooltip="Settings" className="settings big" onClick={this.onSettings} />
				</div>
			</React.Fragment>
		);
	};

	onSettings (e: any) {
		popupStore.open('settings', {});
	};

	componentDidMount () {
		DataUtil.setWindowTitleText('Dashboard');
	};

});

export default HeaderMainIndex;
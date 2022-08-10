import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { I } from 'Lib';
import { Icon } from 'Component';
import { popupStore } from 'Store';
import { observer } from 'mobx-react';

interface Props extends RouteComponentProps<any>, I.HeaderComponent {};

const HeaderMainIndex = observer(class HeaderMainIndex extends React.Component<Props, {}> {
	
	constructor (props: any) {
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
					<Icon tooltip="Settings" className="settings" onClick={this.onSettings} />
				</div>
			</React.Fragment>
		);
	};

	onSettings (e: any) {
		popupStore.open('settings', {});
	};

});

export default HeaderMainIndex;
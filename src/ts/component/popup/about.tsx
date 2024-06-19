import * as React from 'react';
import { Title, Icon, Label, Button } from 'Component';
import { I, U, translate } from 'Lib';

class PopupAbout extends React.Component<I.Popup> {

	constructor (props: I.Popup) {
		super(props);

		this.onVersionCopy = this.onVersionCopy.bind(this);
	};

	render () {
		return (
			<React.Fragment>
				<div className="iconWrapper">
					<Icon />
				</div>
				<Title text={translate('popupAboutTitle')} />
				<Label text={translate('popupAboutDescription')} />

				<div className="version">
					{U.Common.sprintf(translate('popupAboutVersion'), this.getVersion())}
					<Button onClick={this.onVersionCopy} text={translate('commonCopy')} className="c28" color="blank" />
				</div>
				<div className="copyright">{translate('popupAboutCopyright')}</div>
			</React.Fragment>
		);
	};

	getVersion () {
		return U.Common.getElectron().version.app;
	};

	onVersionCopy () {
		U.Common.copyToast(translate('commonVersion'), this.getVersion());
	};

};

export default PopupAbout;
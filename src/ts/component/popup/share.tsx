import * as React from 'react';
import { Title, Label, Button } from 'Component';
import { I, U, J, translate, analytics } from 'Lib';

class PopupShare extends React.Component<I.Popup> {

	constructor (props: I.Popup) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		return (
			<div>
				<Title text={translate('popupShareTitle')} />
				<Label text={translate('popupShareLabel')} />

				<div className="section">
					<Label text={U.Common.sprintf(translate('popupShareLinkText'), J.Url.share, J.Url.share)} />
				</div>

				<Button text={translate('commonCopyLink')} onClick={this.onClick} />
			</div>
		);
	};

	onClick () {
		U.Common.copyToast(translate('commonLink'), J.Url.share);
		analytics.event('ClickShareAppCopyLink');
	};

};

export default PopupShare;

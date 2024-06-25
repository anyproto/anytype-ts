import * as React from 'react';
import { Icon, Label } from 'Component';
import { S, U, translate } from 'Lib'

class Share extends React.Component<{}, {}> {

	render () {
		return (
			<div
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
		U.Common.shareTooltipHide();
		S.Popup.open('share', {});
	};

	onClose (e) {
		e.preventDefault();
		e.stopPropagation();

		U.Common.shareTooltipHide();
	};

};

export default Share;

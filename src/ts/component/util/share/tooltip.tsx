import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { U, S, translate, analytics, Preview, Storage } from 'Lib';

interface Props {
	showOnce?: boolean;
};

const ShareTooltip = observer(class ShareTooltip extends React.Component<Props, {}> {

	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onClick = this.onClick.bind(this);
	};

	render () {
		const { showOnce } = this.props;

		if (showOnce && !S.Common.shareTooltip) {
			return null;
		};

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
		const { showOnce } = this.props;

		S.Popup.open('share', {});
		Preview.shareTooltipHide();

		analytics.event('ClickShareApp', { route: showOnce ? 'Onboarding' : 'Help' });
	};

	onClose (e) {
		e.preventDefault();
		e.stopPropagation();

		Preview.shareTooltipHide();
		Storage.set('shareTooltip', true);
	};

});

export default ShareTooltip;

import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Label } from 'Component';
import { S, translate, analytics, Preview, U, Storage } from 'Lib';

interface Props {
	onClose: () => void;
};

const ShareBanner = observer(class ShareBanner extends React.Component<Props, {}> {

	node: any = null;

	constructor (props: Props) {
		super(props);

		this.onClose = this.onClose.bind(this);
	};

	render () {
		if (!U.Space.isShareBanner()) {
			return null;
		};

		return (
			<div
				ref={ref => this.node = ref}
				id="shareBanner"
				className="shareBanner"
				onClick={this.onClick}
			>
				<Icon className="close" onClick={this.onClose} />
				<Label text={translate('shareBannerLabel')} />
				<Icon className="smile" />
			</div>
		);
	};

	onClick () {
		S.Popup.open('settings', { data: { page: 'spaceShare', isSpace: true }, className: 'isSpace' });
	};

	onClose (e) {
		e.preventDefault();
		e.stopPropagation();

		const { onClose } = this.props;

		Storage.set('shareBannerClosed', true);
		onClose();
	};

});

export default ShareBanner;

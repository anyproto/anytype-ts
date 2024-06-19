import * as React from 'react';
import $ from 'jquery';
import { Title, Button } from 'Component';
import { I, S, J, translate, Renderer, analytics } from 'Lib';
import QRCode from 'qrcode.react';

class PopupInviteQr extends React.Component<I.Popup> {

	node = null;

	constructor (props: I.Popup) {
		super(props);

		this.onDownload = this.onDownload.bind(this);
	};

	render () {
		const { param } = this.props;
		const { data } = param;
		const { link } = data;
		const theme = S.Common.getThemeClass();

		return (
			<div ref={ref => this.node = ref}>
				<Title text={translate('popupInviteQrTitle')} />

				<div className="qrWrap">
					<QRCode value={link} fgColor={J.Theme[theme].qr.foreground} bgColor={J.Theme[theme].qr.bg} size={120} />
				</div>

				<div className="buttons">
					<Button text={translate('commonDownload')} className="c36" color="blank" onClick={this.onDownload} />
				</div>
			</div>
		);
	};

	onDownload () {
		const node = $(this.node);
		const canvas = node.find('canvas').get(0);
		const image = canvas.toDataURL('image/png');

		Renderer.send('download', image, { saveAs: true });
		analytics.event('ClickSettingsSpaceShare', { type: 'DownloadQr' });
	};

};

export default PopupInviteQr;

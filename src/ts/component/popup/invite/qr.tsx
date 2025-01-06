import React, { forwardRef, useRef } from 'react';
import $ from 'jquery';
import { Title, Button } from 'Component';
import { I, S, J, translate, Renderer, analytics } from 'Lib';
import QRCode from 'qrcode.react';

const PopupInviteQr = forwardRef<{}, I.Popup>((props, ref) => {

	const nodeRef = useRef(null);
	const { param } = props;
	const { data } = param;
	const { link } = data;
	const theme = S.Common.getThemeClass();

	const onDownload = () => {
		const canvas = $(nodeRef.current).find('canvas').get(0);
		if (!canvas) {
			return;
		};

		const image = canvas.toDataURL('image/png');
		if (!image) {
			return;
		};

		Renderer.send('download', image, { saveAs: true });
		analytics.event('ClickSettingsSpaceShare', { type: 'DownloadQr' });
	};

	return (
		<div ref={nodeRef}>
			<Title text={translate('popupInviteQrTitle')} />

			<div className="qrWrap">
				<QRCode value={link} fgColor={J.Theme[theme].qr.foreground} bgColor={J.Theme[theme].qr.bg} size={120} />
			</div>

			<div className="buttons">
				<Button text={translate('commonDownload')} className="c36" color="blank" onClick={onDownload} />
			</div>
		</div>
	);

});

export default PopupInviteQr;
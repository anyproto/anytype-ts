import React, { forwardRef, useRef } from 'react';
import $ from 'jquery';
import { Title, Button, QR } from 'Component';
import { I, translate, Renderer, analytics } from 'Lib';

const PopupInviteQr = forwardRef<{}, I.Popup>((props, ref) => {

	const nodeRef = useRef(null);
	const { param } = props;
	const { data } = param;
	const { link } = data;

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
		analytics.event('ClickScreenQr', { type: 'Download' });
	};

	return (
		<div ref={nodeRef}>
			<Title text={translate('popupInviteQrTitle')} />

			<div className="qrWrap">
				<QR value={link} />
			</div>

			<div className="buttons">
				<Button text={translate('commonDownload')} className="c36" color="blank" onClick={onDownload} />
			</div>
		</div>
	);

});

export default PopupInviteQr;

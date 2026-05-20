import React, { forwardRef, useRef } from 'react';
import { Title, Button, QR } from 'Component';
import * as I from 'Interface';

const PopupInviteQr = forwardRef<{}, I.Popup>((props, ref) => {

	const nodeRef = useRef(null);
	const { param } = props;
	const { data } = param;
	const { link } = data;

	const onDownload = () => {
		const canvas = U.Dom.select('canvas', nodeRef.current) as HTMLCanvasElement;
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
				<Button text={translate('commonSaveAsFile')} size={36} color="blank" onClick={onDownload} />
			</div>
		</div>
	);

});

export default PopupInviteQr;

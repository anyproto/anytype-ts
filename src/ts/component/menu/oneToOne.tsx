import React, { forwardRef } from 'react';
import { ObjectName, Button, QR } from 'Component';
import * as I from 'Interface';

const MenuOneToOne = forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {

	const { getId, getContainer } = props;
	const profile = U.Space.getProfile();
	const { account } = S.Auth;
	const { id, info } = account;
	const { metadataKey } = info;
	const deeplink = U.Space.oneToOneLink(id, metadataKey, 'web');
	const qrImageParam = {
		src: '',//`./img/icon/qr.svg`,
		width: 64,
		height: 64,
		excavate: true,
	};

	const onDownload = () => {
		const canvas = U.Dom.select('canvas', getContainer()) as HTMLCanvasElement;
		if (!canvas) {
			return;
		};

		const image = canvas.toDataURL('image/png');
		if (!image) {
			return;
		};

		Renderer.send('download', image, { saveAs: true });
	};

	const onCopy = () => {
		U.Common.copyToast(translate('commonLink'), deeplink);
	};

	return (
		<>
			<div className="nameWrapper">
				<ObjectName object={profile} withBadge={true} />
			</div>

			<div className="qrWrapper">
				<QR size={200} value={deeplink} imageParam={qrImageParam} />
			</div>

			<div className="buttonsWrapper">
				<Button color="accent" size={40} text={translate('commonCopyLink')} onClick={onCopy} />
				<Button color="blank" size={40} text={translate('commonDownloadCode')} onClick={onDownload} />
			</div>
		</>
	);

});

export default MenuOneToOne;
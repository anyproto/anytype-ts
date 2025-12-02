import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';
import { ObjectName, Button, QR } from 'Component';
import { I, U, S, translate, J, Renderer } from 'Lib';
import $ from 'jquery';

const MenuHi = observer(forwardRef<I.MenuRef, I.Menu>((props: I.Menu, ref: any) => {

	const { getId } = props;
	const profile = U.Space.getProfile();
	const { account } = S.Auth;
	const { id, info } = account;
	const { metadataKey } = info;
	const deeplink = `${J.Constant.protocol}://hi/?id=${id}&key=${metadataKey}`;

	const onDownload = () => {
		const canvas = $(`#${getId()}`).find('canvas').get(0);
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
		U.Common.copyToast(translate('commonDeeplink'), deeplink)
	};

	return (
		<>
			<div className="nameWrapper">
				<ObjectName object={profile} withBadge={true} />
			</div>

			<div className="qrWrapper">
				<QR size={200} value={deeplink} />
			</div>

			<div className="buttonsWrapper">
				<Button color="accent" className="c40" text={translate('menuHiDownloadCode')} onClick={onDownload} />
				<Button color="blank" className="c40" text={translate('commonCopyDeeplink')} onClick={onCopy} />
			</div>
		</>
	);

}));

export default MenuHi;

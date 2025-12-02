import React, { forwardRef } from 'react';
import { J, S } from 'Lib';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

interface Props {
	value: string;
	size?: number;
	withLogo?: boolean;
};

const QR = forwardRef<HTMLDivElement, Props>(({
    value = '',
	size = 122,
	withLogo = false,
}, ref) => {
	const theme = S.Common.getThemeClass();
	const logo = withLogo ? {
		src: `./img/icon/qr.svg`,
		width: 60,
		height: 60,
	} : {};

	return (
		<div className="qrInner">
			<QRCode
				value={value}
				fgColor={J.Theme[theme].qr.foreground}
				bgColor={J.Theme[theme].qr.bg}
				size={size}
				imageSettings={logo}
			/>
		</div>
	);

});

export default QR;

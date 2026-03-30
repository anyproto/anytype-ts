import React, { forwardRef } from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import * as I from 'Interface';

interface Props {
	value: string;
	size?: number;
	imageParam?: I.ImageParam;
};

const QR = forwardRef<HTMLDivElement, Props>(({
    value = '',
	size = 122,
	imageParam = { src: '', width: 0, height: 0, excavate: false },
}, ref) => {
	const theme = S.Common.getThemeClass();

	return (
		<div className="qrInner">
			<QRCode
				value={value}
				fgColor={J.Theme[theme].qr.foreground}
				bgColor={J.Theme[theme].qr.bg}
				size={size}
				imageSettings={imageParam}
			/>
		</div>
	);

});

export default QR;

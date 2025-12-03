import React, { forwardRef } from 'react';
import { J, S, I } from 'Lib';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

interface Props {
	value: string;
	size?: number;
	imageParam?: Partial<I.ImageParam>;
};

const QR = forwardRef<HTMLDivElement, Props>(({
    value = '',
	size = 122,
	imageParam = {},
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

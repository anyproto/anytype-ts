import React, { forwardRef } from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import * as I from 'Interface';

type Level = 'L' | 'M' | 'Q' | 'H';

interface Props {
	value: string;
	size?: number;
	imageParam?: I.ImageParam;
	level?: Level;
};

const QR = forwardRef<HTMLDivElement, Props>(({
    value = '',
	size = 122,
	imageParam = { src: '', width: 0, height: 0, excavate: false },
	level = 'L',
}, ref) => {
	const theme = S.Common.getThemeClass();

	return (
		<div className="qrInner">
			<QRCode
				value={value}
				fgColor={J.Theme[theme].qr.foreground}
				bgColor={J.Theme[theme].qr.bg}
				size={size}
				level={level}
				imageSettings={imageParam}
			/>
		</div>
	);

});

export default QR;

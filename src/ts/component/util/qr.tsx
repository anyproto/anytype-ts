import React, { forwardRef } from 'react';
import { J, S } from 'Lib';
import QRCode from 'qrcode.react';

interface Props {
	value: string;
	size?: number;
};

const QR = forwardRef<HTMLDivElement, Props>(({
    value = '',
	size = 122,
}, ref) => {
	const theme = S.Common.getThemeClass();

	return (
		<div className="qrInner">
			<QRCode value={value} fgColor={J.Theme[theme].qr.foreground} bgColor={J.Theme[theme].qr.bg} size={size} />
		</div>
	);

});

export default QR;

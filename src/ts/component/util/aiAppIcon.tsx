import React, { forwardRef, useState } from 'react';
import { aiAppIconUrl } from 'Lib/aiConnect/icons';

interface Props {
	/** The card: its bundled mark comes first */
	appId?: string;
	/** The app's name: its first letter is the avatar when there is no icon */
	name: string;
	/** The real app icon (a PNG data URL from main), when Anytype found the app */
	icon?: string;
};

/** An AI app's icon on its card and in the connect sheet: the card's bundled mark, else the installed app's own icon, else a letter avatar */
const AiAppIcon = forwardRef<HTMLDivElement, Props>(({ appId, name, icon }, ref) => {
	const [ failed, setFailed ] = useState<string[]>([]);
	const letter = Array.from(String(name || '?').trim() || '?')[0].toLocaleUpperCase();
	const mark = aiAppIconUrl(String(appId || ''), S.Common.getThemePath());
	const png = (!!icon && /^data:image\/png;base64,/.test(icon)) ? icon : '';
	const src = [ mark, png ].find(it => it && !failed.includes(it)) || '';
	const isMark = !!src && (src == mark);
	const cn = [ 'aiAppIcon', (src ? (isMark ? 'isMark' : 'withImage') : 'isLetter') ];

	return (
		<div ref={ref} className={cn.join(' ')} aria-hidden="true">
			{src ? <img key={src} src={src} alt="" onError={() => setFailed(list => list.concat(src))} /> : <span className="letter">{letter}</span>}
		</div>
	);
});

export default AiAppIcon;

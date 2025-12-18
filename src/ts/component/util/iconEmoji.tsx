import React, { forwardRef } from 'react';
import { U } from 'Lib';

interface Props {
	id?: string;
	icon?: string;
	size?: number;
	asImage?: boolean;
	className?: string;
	canEdit?: boolean;
};

const IconEmoji = forwardRef<HTMLDivElement, Props>(({
	id = '',
	icon = '',
	size = 18,
	asImage = true,
	className = '',
	canEdit = false,
}, ref) => {

	const cn = [ 'iconEmoji', className ];
	const css = { lineHeight: `${size}px` };

	if (canEdit) {
		cn.push('canEdit');
	};

	let element = null;
	if (!icon) {
		return null;
	};

	const code = icon.match(':') ? icon : U.Smile.getCode(icon);
	if (code) {
		if (asImage) {
			element = (
				<img 
					src={U.Smile.srcFromColons(code)}
					className={[ 'smileImage', `c${size}` ].join(' ')}
					onDragStart={e=> e.preventDefault()}
				/>
			);
		} else {
			element = <em-emoji shortcodes={code}></em-emoji>;
		};
	};

	if (!element) {
		return null;
	};

	return (
		<div id={id} style={css} className={cn.join(' ')}>
			{element}
		</div>
	);

});

export default IconEmoji;
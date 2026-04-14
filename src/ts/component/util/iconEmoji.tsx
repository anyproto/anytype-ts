import React, { forwardRef } from 'react';

interface Props {
	id?: string;
	icon?: string;
	size?: number;
	className?: string;
	canEdit?: boolean;
};

const IconEmoji = forwardRef<HTMLDivElement, Props>(({
	id = '',
	icon = '',
	size = 18,
	className = '',
	canEdit = false,
}, ref) => {

	const cn = [ 'iconEmoji', className ];
	const css = { lineHeight: `${size}px` };

	if (canEdit) {
		cn.push('canEdit');
	};

	if (!icon) {
		return null;
	};

	const code = icon.match(':') ? icon : U.Smile.getCode(icon);
	if (!code) {
		return null;
	};

	return (
		<div id={id} style={css} className={cn.join(' ')}>
			<img
				src={U.Smile.srcFromColons(code)}
				className={[ 'smileImage', `c${size}` ].join(' ')}
				onDragStart={e => e.preventDefault()}
			/>
		</div>
	);

});

export default IconEmoji;
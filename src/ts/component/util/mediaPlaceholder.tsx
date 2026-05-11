import React, { FC } from 'react';
import { Icon } from 'Component';
import * as I from 'Interface';

interface Props {
	iconParam?: I.IconParam;
	text: string;
	readonly?: boolean;
	onClick?: (e: any) => void;
};

const MediaPlaceholder: FC<Props> = ({ iconParam, text, readonly, onClick }) => {

	const cn = [ 'mediaPlaceholder' ];

	if (readonly) {
		cn.push('isReadonly');
	};

	const handleClick = (e: any) => {
		if (readonly) {
			return;
		};

		onClick?.(e);
	};

	return (
		<div className={cn.join(' ')} onClick={handleClick}>
			{iconParam ? <Icon {...iconParam} /> : ''}
			<div className="name">{text}</div>
		</div>
	);
};

export default MediaPlaceholder;

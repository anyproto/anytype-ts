import React, { forwardRef, ReactNode, MouseEvent } from 'react';
import { I, S } from 'Lib';

interface Props {
	id?: string;
	image?: string;
	src?: string;
	className?: string;
	type?: number;
	x?: number;
	y?: number;
	scale?: number;
	withScale?: boolean;
	children?: ReactNode;
	onClick?(e: MouseEvent<HTMLDivElement>): void;
	onMouseDown?(e: MouseEvent<HTMLDivElement>): void;
};

const Cover = forwardRef<HTMLDivElement, Props>(({ 
	id = '', 
	image = '', 
	src = '', 
	type = 0, 
	x = 0.5, 
	y = 0.5, 
	scale = 0, 
	withScale = false, 
	className = '', 
	onClick, 
	onMouseDown, 
	children,
}, ref) => {

	const cn = [ 'cover', `type${type}`, id, className ];
	const style: React.CSSProperties = {};
	
	if ([ I.CoverType.Upload, I.CoverType.Source ].includes(type) && image) {
		style.backgroundImage = `url("${S.Common.imageUrl(image, I.ImageSize.Large)}")`;
	};

	if (src) {
		style.backgroundImage = `url("${src}")`;
	};
	
	if (withScale) {
		style.backgroundPosition = `${Math.abs(x * 100)}% ${Math.abs(y * 100)}%`;
		style.backgroundSize = ((scale + 1) * 100) + '%';
	};
	
	return (
		<div 
			ref={ref}
			className={cn.join(' ')} 
			onClick={onClick} 
			onMouseDown={onMouseDown}
			style={style}>
			{children}
		</div>
	);
});

export default Cover;
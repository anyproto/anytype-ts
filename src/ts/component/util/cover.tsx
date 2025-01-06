import React, { FC, MouseEvent } from 'react';
import { I, S, J } from 'Lib';

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
	children?: React.ReactNode;
	onClick?(e: MouseEvent): void;
	onMouseDown?(e: MouseEvent): void;
};

const Cover: FC<Props> = ({ 
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
}) => {

	const cn = [ 'cover', `type${type}`, id, className ];
	const style: any = {};
	
	if ([ I.CoverType.Upload, I.CoverType.Source ].includes(type) && image) {
		style.backgroundImage = `url("${S.Common.imageUrl(image, J.Size.cover)}")`;
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
			className={cn.join(' ')} 
			onClick={onClick} 
			onMouseDown={onMouseDown}
			style={style}>
			{children}
		</div>
	);
};

export default Cover;
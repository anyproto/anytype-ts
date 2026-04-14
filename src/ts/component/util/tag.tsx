import React, { FC, useRef, useEffect, MouseEvent } from 'react';

interface Props {
	id?: string;
	text?: string;
	className?: string;
	color?: string;
	canEdit?: boolean;
	isSmall?: boolean;
	onClick?: (e: any) => void;
	onRemove?: (e: any) => void;
	onContextMenu?(e: any): void;
};

const Tag: FC<Props> = ({
	id = '',
	text = '',
	className = '',
	color = '',
	canEdit = false,
	isSmall = false,
	onClick,
	onRemove,
	onContextMenu,
}) => {

	const nodeRef = useRef(null);
	const c = color || 'default';
	const cn = [ 'tagItem', 'textColor', `textColor-${c}`, 'bgColor', `bgColor-${c}` ];

	if (className) {
		cn.push(className);
	};
	if (canEdit) {
		cn.push('canEdit');
	};
	if (isSmall) {
		cn.push('isSmall');
	};

	const onRemoveHandler = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (canEdit && onRemove) {
			onRemove(e);
		};
	};

	const removeSvg = (color: any) => {
		const svg = `
			<svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path fill-rule="evenodd" clip-rule="evenodd" d="M2.44194 1.55806C2.19786 1.31398 1.80214 1.31398 1.55806 1.55806C1.31398 1.80214 1.31398 2.19786 1.55806 2.44194L4.11612 5L1.55806 7.55806C1.31398 7.80214 1.31398 8.19786 1.55806 8.44194C1.80214 8.68602 2.19786 8.68602 2.44194 8.44194L5 5.88388L7.55806 8.44194C7.80214 8.68602 8.19786 8.68602 8.44194 8.44194C8.68602 8.19786 8.68602 7.80214 8.44194 7.55806L5.88388 5L8.44194 2.44194C8.68602 2.19786 8.68602 1.80214 8.44194 1.55806C8.19786 1.31398 7.80214 1.31398 7.55806 1.55806L5 4.11612L2.44194 1.55806Z" fill="${color}"/>
			</svg>
		`;
		return `data:image/svg+xml;base64,${btoa(svg)}`;
	};

	const setColor = () => {
		const node = nodeRef.current;
		if (!node) {
			return;
		};

		const remove = U.Dom.select('#remove', node) as HTMLImageElement;
		const color = getComputedStyle(node).color;

		if (remove) {
			remove.src = removeSvg(color);
		};
	};

	let icon = null;
	if (canEdit) {
		icon = (
			<div className="tagRemove" onMouseDown={onRemoveHandler}>
				<img id="remove" />
			</div>
		);
	};

	useEffect(() => setColor());
	
	return (
		<span 
			id={id}
			ref={nodeRef}
			contentEditable={false} 
			className={cn.join(' ')}
			onContextMenu={onContextMenu}
			onClick={onClick}
		>
			<span className="inner">{text}</span>
			{icon}
		</span>
	);
};

export default Tag;
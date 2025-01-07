import React, { FC, forwardRef, MouseEvent } from 'react';
import { U, translate } from 'Lib';

interface Props {
	object: any;
	className?: string;
	onClick? (e: MouseEvent): void;
	onMouseDown? (e: MouseEvent): void;
	onMouseEnter? (e: MouseEvent): void;
	onMouseLeave? (e: MouseEvent): void;
};

const ObjectName: FC<Props> = ({
	object = {},
	className = 'name',
	onClick,
	onMouseDown,
	onMouseEnter,
	onMouseLeave,
}) => {
	object = object || {};

	const { layout, snippet, isDeleted } = object;

	let name = String(object.name || '');
	if (!isDeleted) {
		if (U.Object.isNoteLayout(layout)) {
			name = snippet || <span className="empty">{translate('commonEmpty')}</span>;
		} else {
			name = U.Object.name(object);
		};
	};

	return (
		<div 
			className={className} 
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseEnter={onMouseEnter} 
			onMouseLeave={onMouseLeave}
		>
			<span>{name}</span>
		</div>
	);

};

export default ObjectName;
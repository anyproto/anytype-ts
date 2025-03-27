import React, { FC, MouseEvent } from 'react';
import { U, translate } from 'Lib';

interface Props {
	object: any;
	className?: string;
	withLatex?: boolean;
	withPlural?: boolean;
	onClick? (e: MouseEvent): void;
	onMouseDown? (e: MouseEvent): void;
	onMouseEnter? (e: MouseEvent): void;
	onMouseLeave? (e: MouseEvent): void;
};

const ObjectName: FC<Props> = ({
	object = {},
	className = 'name',
	withLatex = false,
	withPlural = false,
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
			name = snippet || `<span class="empty">${translate('commonEmpty')}</span>`;
		} else {
			name = U.Object.name(object, withPlural);
		};

		if (withLatex) {
			name = U.Common.getLatex(name);
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
			<span dangerouslySetInnerHTML={{ __html: U.Common.sanitize(name) }} />
		</div>
	);

};

export default ObjectName;
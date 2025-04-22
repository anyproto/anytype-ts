import React, { FC, MouseEvent } from 'react';
import { U, translate } from 'Lib';

interface Props {
	object: any;
	className?: string;
	withLatex?: boolean;
	withPlural?: boolean;
	withPronoun?: boolean;
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
	withPronoun= false,
	onClick,
	onMouseDown,
	onMouseEnter,
	onMouseLeave,
}) => {
	object = object || {};

	const { layout, snippet, isDeleted } = object;

	let name = String(object.name || '');
	let empty = null;
	let latex = null;
	let content = null;
	let you = null;

	if (!isDeleted) {
		if (U.Object.isNoteLayout(layout)) {
			name = snippet;
		} else {
			name = U.Object.name(object, withPlural);
		};

		if (withLatex) {
			latex = U.Common.getLatex(name);
		};
	};

	if (!name) {
		empty = <span className="empty">{translate('commonEmpty')}</span>;
	};
	if (withPronoun) {
		you = <span className="you"> ({translate('commonYou')})</span>;
	};

	if (!empty && !latex) {
		content = <span>{name}{you}</span>;
	};

	return (
		<div 
			className={className} 
			onClick={onClick}
			onMouseDown={onMouseDown}
			onMouseEnter={onMouseEnter} 
			onMouseLeave={onMouseLeave}
		>
			{empty}
			{latex}
			{content}
		</div>
	);

};

export default ObjectName;

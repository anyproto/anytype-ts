import React, { forwardRef } from 'react';
import { Icon, Label, Button } from 'Component';

interface Props {
	text?: string;
	className?: string;
	buttonText?: string;
	buttonColor?: string;
	buttonSize?: 16 | 28 | 32 | 36 | 40 | 48;
	onButton?: () => void;
};

const EmptyState = forwardRef<HTMLDivElement, Props>(({
	text = '',
	className= '',
	buttonText = '',
	buttonColor = '',
	buttonSize = 28,
	onButton,
}, ref) => {
	if (!text) {
		text = translate('commonObjectEmpty');
	};

	return (
		<div className={[ 'emptyState', className ].join(' ')}>
			<Icon />
			<Label text={text} />
			{buttonText && onButton ? <Button onClick={onButton} text={buttonText} size={buttonSize} color={buttonColor ? buttonColor : 'blank'} /> : ''}
		</div>
	);
});

export default EmptyState;

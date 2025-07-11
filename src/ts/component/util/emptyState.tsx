import React, { forwardRef } from 'react';
import { U, translate } from 'Lib';
import { Icon, Label, Button } from 'Component';

interface Props {
	text?: string;
	className?: string;
	buttonText?: string;
	buttonColor?: string;
	buttonSize?: string;
	onButton?: () => void;
};

const EmptyState = forwardRef<HTMLDivElement, Props>(({
	text = '',
	className= '',
	buttonText = '',
	buttonColor = '',
	buttonSize = '',
	onButton,
}, ref) => {
	if (!text) {
		text = translate('commonObjectEmpty');
	};

	return (
		<div className={[ 'emptyState', className ].join(' ')}>
			<Icon />
			<Label text={text} />
			{buttonText && onButton ? <Button onClick={onButton} text={buttonText} className={buttonSize ? buttonSize : 'c28'} color={buttonColor ? buttonColor : 'blank'} /> : ''}
		</div>
	);
});

export default EmptyState;

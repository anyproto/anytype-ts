import React, { forwardRef } from 'react';
import { U, translate } from 'Lib';

interface Props {
	text?: string;
	filter?: string;
	readonly?: boolean;
	style?: any;
	className?: string;
};

const EmptySearch = forwardRef<HTMLDivElement, Props>(({
	text = '',
	filter = '',
	readonly = false,
	style = {},
	className= '',
}, ref) => {
	if (!text) {
		if (filter) {
			text = U.String.sprintf(translate(readonly ? 'popupSearchEmptyFilterReadonly' : 'popupSearchEmptyFilter'), filter);
		} else {
			text = translate('popupSearchEmpty');
		};
	};

	return (
		<div className={[ 'emptySearch', className ].join(' ')} style={style}>
			<div className="txt" dangerouslySetInnerHTML={{ __html: U.String.sanitize(text) }} />
		</div>
	);
});

export default EmptySearch;

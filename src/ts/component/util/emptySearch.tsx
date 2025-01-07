import React, { forwardRef } from 'react';
import { U, translate } from 'Lib';

interface Props {
	text?: string;
	filter?: string;
	readonly?: boolean;
	style?: any;
};

const EmptySearch = forwardRef<HTMLDivElement, Props>(({
	text = '',
	filter = '',
	readonly = false,
	style = {},
}, ref) => {
	if (!text) {
		if (filter) {
			text = U.Common.sprintf(translate(readonly ? 'popupSearchEmptyFilterReadonly' : 'popupSearchEmptyFilter'), filter);
		} else {
			text = translate('popupSearchEmpty');
		};
	};

	return (
		<div style={style} className="emptySearch">
			<div className="txt" dangerouslySetInnerHTML={{ __html: U.Common.sanitize(text) }} />
		</div>
	);
});

export default EmptySearch;
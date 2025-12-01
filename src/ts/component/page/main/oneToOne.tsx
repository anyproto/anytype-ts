import React, { forwardRef } from 'react';
import { I, keyboard } from 'Lib';

const PageMainOneToOne = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const { isPopup } = props;
	const param = keyboard.getMatch(isPopup).params;

	return (
		<div>
			One to One Page
			{JSON.stringify(param, null, 3)}
		</div>
	);

});

export default PageMainOneToOne;
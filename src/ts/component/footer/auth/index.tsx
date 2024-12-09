import React, { forwardRef } from 'react';
import { I, U } from 'Lib';

const FooterAuthIndex = forwardRef<{}, I.FooterComponent>(() => {

	return (
		<div className="copy">{U.Date.date('Y', U.Date.now())}, Anytype</div>
	);

});

export default FooterAuthIndex;
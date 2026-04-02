import React, { forwardRef, useEffect } from 'react';
import * as I from 'Interface';

const FALLBACK_TIMEOUT = 3000;

const PageMainBlank = forwardRef<I.PageRef, I.PageComponent>(() => {

	useEffect(() => {
		const timeout = window.setTimeout(() => {
			if (!U.Router.isOpening) {
				U.Space.openDashboard({ replace: true });
			};
		}, FALLBACK_TIMEOUT);

		return () => window.clearTimeout(timeout);
	}, []);

	return (
		<div />
	);

});

export default PageMainBlank;

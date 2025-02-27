import React, { forwardRef, useEffect } from 'react';
import { I, C, U } from 'Lib';

const PageMainObject = forwardRef<{}, I.PageComponent>((props, ref) => {

	const { match } = props;

	useEffect(() => {
		const { id, spaceId, cid, key } = match.params || {};
		const space = U.Space.getSpaceviewBySpaceId(spaceId);

		// Redirect to invite page when invite parameters are present
		if ((!space || !space.isAccountActive) && cid && key) {
			U.Router.go(`/main/invite/?cid=${cid}&key=${key}`, { replace: true });
			return;
		};

		C.ObjectShow(id, '', spaceId, (message: any) => {
			if (message.error.code) {
				U.Space.openDashboard();
				return;
			};

			const details = message.objectView?.details || [];
			const item = details.find(it => it.id == id);

			if (!item) {
				console.error('Object not found');
				return;
			};

			U.Object.openRoute(item.details);
		});

	}, []);

	return <div />;

});

export default PageMainObject;
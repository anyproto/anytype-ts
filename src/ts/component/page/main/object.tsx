import React, { forwardRef, useEffect } from 'react';
import { I, C, U, S, Action, analytics } from 'Lib';

const PageMainObject = forwardRef<{}, I.PageComponent>((props, ref) => {

	const { match } = props;

	useEffect(() => {
		const { id, spaceId, cid, key } = match.params || {};
		const space = U.Space.getSpaceviewBySpaceId(spaceId);
		const route = match.params.route || analytics.route.app;

		// Redirect to invite page when invite parameters are present
		if ((!space || !space.isAccountActive) && cid && key) {
			U.Router.go(`/main/invite/?cid=${cid}&key=${key}`, { replace: true });
			analytics.event('OpenObjectByLink', { route, type: 'Invite' });
			return;
		};

		C.ObjectShow(id, '', spaceId, (message: any) => {
			if (message.error.code) {
				U.Space.openDashboard();
				return;
			};

			const object = S.Detail.get(id, id);

			if (object._empty_) {
				U.Space.openDashboard();
				console.error('Object not found');
				return;
			};

			U.Object.openRoute(object);
			analytics.event('OpenObjectByLink', { route, objectType: object.type, type: 'Object' });
		});

		return () => {
			Action.pageClose(id, false);
		};

	}, []);

	return <div />;

});

export default PageMainObject;
import React, { forwardRef, useEffect } from 'react';
import { I, C, U, S, Action, analytics } from 'Lib';

const PageMainObject = forwardRef<{}, I.PageComponent>((props, ref) => {

	const { match } = props;

	useEffect(() => {
		const { id, spaceId, cid, key, messageOrder } = match.params || {};
		const space = U.Space.getSpaceviewBySpaceId(spaceId);
		const route = match.params.route || analytics.route.app;

		// Redirect to invite page when invite parameters are present
		if ((!space || !space.isAccountActive) && cid && key) {
			U.Router.go(`/main/invite/?cid=${cid}&key=${key}`, { replace: true });
			analytics.event('OpenObjectByLink', { route, type: 'Invite' });
			return;
		};

		U.Object.getById(id, { spaceId }, object => {
			if (!object) {
				U.Space.openDashboard();
				return;
			};

			U.Object.openRoute({ 
				...object, 
				_routeParam_: {
					additional: [
						{ key: 'messageOrder', value: decodeURIComponent(messageOrder) },
					]
				} 
			});

			analytics.event('OpenObjectByLink', { route, objectType: object.type, type: 'Object' });
		});

		return () => {
			Action.pageClose(id, false);
		};

	}, []);

	return <div />;

});

export default PageMainObject;
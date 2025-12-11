import React, { forwardRef, useEffect } from 'react';
import { I, U, J, S, analytics, keyboard } from 'Lib';

const PageMainObject = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	useEffect(() => {
		const { isPopup } = props;
		const match = keyboard.getMatch(isPopup);
		const { id, spaceId, cid, key, messageId } = match.params;
		const { space } = S.Common;
		const spaceview = U.Space.getSpaceviewBySpaceId(spaceId);
		const route = match.params.route || analytics.route.app;

		// Redirect to invite page when invite parameters are present
		if ((!spaceview || !spaceview.isAccountActive) && cid && key) {
			U.Router.go(`/main/invite/?cid=${cid}&key=${key}`, { replace: true });
			analytics.event('OpenObjectByLink', { route, type: 'Invite' });
			return;
		};

		if ((id == J.Constant.blankId) && spaceId && (spaceId != space)) {
			U.Router.switchSpace(spaceId, '', false, {}, false);
			return;
		};

		const callBack = () => {
			U.Object.getById(id, { spaceId }, object => {
				if (!object) {
					U.Space.openDashboardOrVoid();
					return;
				};

				const routeParam = { additional: [] };

				if (messageId) {
					routeParam.additional.push({ key: 'messageId', value: messageId });
				};

				U.Object.openRoute({ ...object, _routeParam_: routeParam });
				analytics.event('OpenObjectByLink', { route, objectType: object.type, type: 'Object' });
			});
		};

		if (spaceId && (space != spaceId)) {
			U.Router.switchSpace(spaceId, '', false, { onRouteChange: callBack }, false);
		} else {
			callBack();
		};
	}, []);

	return <div />;

});

export default PageMainObject;
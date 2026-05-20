import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { Loader, Frame, Title } from 'Component';
import * as I from 'Interface';

const PageMainMembership = forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;

	const init = () => {
		const { code } = keyboard.getMatch(false).params;

		U.Space.openDashboardOrVoid({
			replace: true,
			onRouteChange: () => {
				if (code) {
					S.Popup.open('membershipActivation', { data: { code } });
				} else {
					Action.openSettings('membership', analytics.route.stripe);
				};
			},
		});

		resize();
	};

	const resize = () => {
		const obj = U.Dom.getPageFlexContainer(isPopup);
		const h = isPopup ? (obj?.clientHeight || 0) : window.innerHeight;

		if (nodeRef.current) {
			U.Dom.css(nodeRef.current, { height: `${h}px` });
		};
	};

	useEffect(() => {
		init();
	}, []);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	return (
		<div 
			ref={nodeRef}
			className="wrapper"
		>
			<Frame>
				<Title text={translate('pageMainMembershipTitle')} />
				<Loader />
			</Frame>
		</div>
	);

});

export default PageMainMembership;
import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Loader, Frame, Title } from 'Component';
import { I, S, U, translate, keyboard, Action, analytics } from 'Lib';

const PageMainMembership = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;

	const init = () => {
		const { code } = keyboard.getMatch(false).params;

		U.Space.openDashboardOrVoid({
			replace: true,
			onFadeIn: () => {
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
		const win = $(window);
		const node = $(nodeRef.current);
		const obj = U.Common.getPageFlexContainer(isPopup);

		node.css({ height: (isPopup ? obj.height() : win.height()) });
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

}));

export default PageMainMembership;
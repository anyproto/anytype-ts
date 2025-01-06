import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Loader, Frame, Title, Error, Button } from 'Component';
import { I, S, U, J, translate, analytics } from 'Lib';

const PageMainMembership = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;
	const [ error, setError ] = useState('');
	const { membership } = S.Auth;
	const { status, tier } = membership;

	const init = () => {
		const data = U.Common.searchParam(U.Router.history.location.search);
	
		let { tier } = data;

		U.Data.getMembershipStatus((membership: I.Membership) => {
			if (!membership || membership.isNone) {
				setError(translate('pageMainMembershipError'));
				return;
			};

			U.Space.openDashboard('route', {
				replace: true,
				animate: true,
				onFadeIn: () => {
					if (tier && (tier != I.TierType.None)) {
						if (!membership.isNone && !membership.isExplorer) {
							tier = membership.tier;
						};

						S.Popup.open('membership', { data: { tier } });
					} else {
						finalise();
					};
				},
			});
		});

		resize();
	};

	const finalise = () => {
		S.Popup.closeAll(null, () => {
			if (status == I.MembershipStatus.Finalization) {
				S.Popup.open('membershipFinalization', { data: { tier } });
			} else {
				S.Popup.open('membership', {
					onClose: () => {
						window.setTimeout(() => S.Popup.open('settings', { data: { page: 'membership' } }), J.Constant.delay.popup * 2);
					},
					data: {
						tier: membership.tier,
						success: true,
					},
				});

				analytics.event('ChangePlan', { params: { tier }});
			};
		});
	};

	const resize = () => {
		const win = $(window);
		const node = $(nodeRef.current);
		const obj = U.Common.getPageContainer(isPopup);

		node.css({ height: (isPopup ? obj.height() : win.height()) });
	};

	useEffect(() => init(), []);

	useImperativeHandle(ref, () => ({
		resize,
	}));

	return (
		<div 
			ref={nodeRef}
			className="wrapper"
		>
			<Frame>
				<Title text={error ? translate('commonError') : translate('pageMainMembershipTitle')} />
				<Error text={error} />

				{error ? (
					<div className="buttons">
						<Button 
							text={translate('commonBack')} 
							color="blank" 
							className="c36" 
							onClick={() => U.Space.openDashboard('route')} 
						/>
					</div>
				) : <Loader />}
			</Frame>
		</div>
	);

}));

export default PageMainMembership;
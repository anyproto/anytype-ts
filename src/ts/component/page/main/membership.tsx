import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Loader, Frame, Title, Error, Button } from 'Component';
import { I, S, U, J, translate, analytics, sidebar, keyboard } from 'Lib';

const PageMainMembership = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;
	const [ error, setError ] = useState('');

	const init = () => {
		let { code, tier: newTier } = keyboard.getMatch(false).params;

		U.Data.getMembershipTiers(true, () => {;
			U.Data.getMembershipStatus((membership: I.Membership) => {
				if (!membership || membership.isNone) {
					setError(translate('pageMainMembershipError'));
					return;
				};

				const tier = U.Data.getMembershipTier(membership.tier);

				U.Space.openDashboardOrVoid({
					replace: true,
					onFadeIn: () => {
						window.setTimeout(() => {
							if (code) {
								S.Popup.open('membershipActivation', { data: { code } });
							} else
							if (newTier && (newTier != I.TierType.None)) {
								if (tier.price) {
									newTier = tier.id;
								};

								S.Popup.open('membership', { data: { tier: newTier } });
							} else 
							if (membership.status == I.MembershipStatus.Finalization) {
								S.Popup.open('membershipFinalization', { data: { tier } });
							} else {
								S.Popup.open('membership', {
									data: {
										onContinue: () => U.Object.openRoute({ id: 'membership', layout: I.ObjectLayout.Settings }),
										tier: membership.tier,
										success: true,
									},
								});

								analytics.event('ChangePlan', { params: { tier }});
							};
						}, J.Constant.delay.popup);
					},
				});
			});
		});

		resize();
	};

	const resize = () => {
		const win = $(window);
		const node = $(nodeRef.current);
		const obj = U.Common.getPageFlexContainer(isPopup);

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
							onClick={() => U.Space.openDashboardOrVoid()} 
						/>
					</div>
				) : <Loader />}
			</Frame>
		</div>
	);

}));

export default PageMainMembership;
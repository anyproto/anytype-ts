import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Loader, Frame, Title, Error, Button } from 'Component';
import { I, S, U, translate, Action } from 'Lib';

const PageMainMembership = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;
	const [ error, setError ] = useState('');

	const init = () => {
		const { history } = U.Router;
		const { location } = history;
		const data = U.Common.searchParam(location.search);

		U.Data.getMembershipProducts(true, () => {
			/*
			U.Data.getMembershipStatus(true, (membership: I.Membership) => {
				if (!membership) {
					setError(translate('pageMainMembershipError'));
					return;
				};

				const { status, tier } = membership;

				U.Space.openDashboardOrVoid({
					replace: true,
					onFadeIn: () => {
						if (data.code) {
							S.Popup.open('membershipActivation', { data });
						} else
						if (status == I.MembershipStatus.Finalization) {
							S.Popup.open('membershipFinalization', { data: { tier } });
						} else {
							Action.openSettings('membership', '');
						};
					},
				});
			});
			*/
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

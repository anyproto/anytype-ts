import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Loader, Frame, Title, Error, Button } from 'Component';
import { I, S, U, translate, Action, analytics } from 'Lib';

const PageMainMembership = observer(forwardRef<I.PageRef, I.PageComponent>((props, ref) => {

	const nodeRef = useRef(null);
	const { isPopup } = props;
	const [ error, setError ] = useState('');


	const init = () => {
		const { history } = U.Router;
		const { location } = history;
		const searchParam = U.Common.searchParam(location.search);
		const { data } = S.Membership;

		if (!data) {
			setError(translate('pageMainMembershipError'));
			return;
		};

		const purchased = data.getTopProduct();
		const { product, status } = purchased;

		U.Space.openDashboardOrVoid({
			replace: true,
			onFadeIn: () => {
				if (searchParam.code) {
					S.Popup.open('membershipActivation', { data: searchParam });
				} else
				if (status == I.MembershipStatus.Finalization) {
					S.Popup.open('membershipFinalization', {
						data: {
							product,
							route: analytics.route.stripe,
						},
					});
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
		U.Data.getMembershipStatus(true, init);
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

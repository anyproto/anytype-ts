import * as React from 'react';
import { Loader, Frame, Title, Error, Button } from 'Component';
import { I, S, U, J, translate, analytics } from 'Lib';

interface State {
	error: string;
};

class PageMainMembership extends React.Component<I.PageComponent, State> {

	state = {
		error: '',
	};
	node = null;

	render () {
		const { error } = this.state;

		return (
			<div 
				ref={ref => this.node = ref}
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
	};

	componentDidMount (): void {
		this.init();
	};

	init () {
		const data = U.Common.searchParam(U.Router.history.location.search);
	
		let { tier } = data;

		U.Data.getMembershipStatus((membership: I.Membership) => {
			if (!membership || membership.isNone) {
				this.setState({ error: translate('pageMainMembershipError') });
				return;
			};

			U.Space.openDashboard('route', {
				onRouteChange: () => {
					if (tier && (tier != I.TierType.None)) {
						if (!membership.isNone && !membership.isExplorer) {
							tier = membership.tier;
						};

						console.log('TIER', tier);

						S.Popup.open('membership', { data: { tier } });
					} else {
						this.finalise();
					};
				},
			});
		});

		this.resize();
	};

	finalise () {
		const { membership } = S.Auth;
		const { status, tier } = membership;

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

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const obj = U.Common.getPageContainer(isPopup);
		const node = $(this.node);
		const wrapper = obj.find('.wrapper');
		const oh = obj.height();
		const header = node.find('#header');
		const hh = header.height();
		const wh = isPopup ? oh - hh : win.height();

		wrapper.css({ height: wh, paddingTop: isPopup ? 0 : hh });
	};

};

export default PageMainMembership;

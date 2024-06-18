import * as React from 'react';
import { Loader, Frame, Title, Error, Button } from 'Component';
import { I, S, UtilCommon, UtilSpace, UtilData, translate, analytics } from 'Lib';

interface State {
	error: string;
};

const Constant = require('json/constant.json');

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
								onClick={() => UtilSpace.openDashboard('route')} 
							/>
						</div>
					) : <Loader />}
				</Frame>
			</div>
		);
	};

	componentDidMount (): void {
		UtilData.getMembershipStatus((membership: I.Membership) => {
			if (!membership || membership.isNone) {
				this.setState({ error: translate('pageMainMembershipError') });
				return;
			};

			UtilSpace.openDashboard('route', {
				onRouteChange: () => {
					S.Popup.closeAll(null, () => {
						const { status, tier } = membership;

						if (status && (status == I.MembershipStatus.Finalization)) {
							S.Popup.open('membershipFinalization', { data: { tier } });
						} else {
							S.Popup.open('membership', {
								onClose: () => {
									window.setTimeout(() => S.Popup.open('settings', { data: { page: 'membership' } }), Constant.delay.popup * 2);
								},
								data: {
									tier: membership.tier,
									success: true,
								},
							});

							analytics.event('ChangePlan', { params: { tier }});
						};
					});
				},
			});
		});

		this.resize();
	};

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const obj = UtilCommon.getPageContainer(isPopup);
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

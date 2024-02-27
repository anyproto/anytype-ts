import * as React from 'react';
import { Loader, Frame, Title } from 'Component';
import { I, UtilCommon, UtilObject, UtilData, translate } from 'Lib';
import { popupStore } from 'Store';

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
					<Title text={translate('pageMainMembershipTitle')} />
					<Loader />
				</Frame>
			</div>
		);
	};

	componentDidMount (): void {
		popupStore.closeAll([], () => {
			UtilData.getMembershipData((membership) => {
				if (membership.tier) {
					UtilObject.openHome('route');
					popupStore.open('subscriptionPlan', {
						onClose: () => {
							window.setTimeout(() => {
								popupStore.open('settings', { data: { page: 'membership' } })
							}, 500);
						},
						data: { tier: membership.tier, success: true }
					});
				};
			});
		});

		// this.resize();
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

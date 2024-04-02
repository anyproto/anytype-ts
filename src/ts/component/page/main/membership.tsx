import * as React from 'react';
import { Loader, Frame, Title, Error, Button } from 'Component';
import { I, UtilCommon, UtilSpace, UtilData, translate, keyboard } from 'Lib';
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
					<Error text={error} />

					{error ? (
						<div className="buttons">
							<Button text={translate('commonBack')} className="c28" onClick={() => UtilSpace.openDashboard('route')} />
						</div>
					) : ''}
				</Frame>
			</div>
		);
	};

	componentDidMount (): void {
		UtilData.getMembershipData((membership: I.Membership) => {
			if (!membership || membership.isNone) {
				this.setState({ error: translate('pageMainMembershipError') });
				return;
			};

			UtilSpace.openDashboard('route');

			popupStore.closeAll(null, () => {
				popupStore.open('membership', {
					onClose: () => {
						window.setTimeout(() => {
							popupStore.open('settings', { data: { page: 'membership' } });
						}, popupStore.getTimeout());
					},
					data: { 
						tier: membership.tier, 
						success: true,
					},
				});
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

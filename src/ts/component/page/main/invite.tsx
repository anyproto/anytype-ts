import * as React from 'react';
import { Loader, Title, Error, Frame, Button } from 'Component';
import { I, C, UtilCommon, UtilRouter, UtilSpace, translate } from 'Lib';
import { popupStore } from 'Store';

interface State {
	error: string;
};

class PageMainInvite extends React.Component<I.PageComponent, State> {

	state = {
		error: '',
	};
	cid = '';
	key = '';
	node = null;
	refFrame = null;

	render () {
		const { error } = this.state;

		return (
			<div 
				ref={ref => this.node = ref}
				className="wrapper"
			>
				<Frame ref={ref => this.refFrame = ref}>
					<Title text={error ? translate('commonError') : translate('pageMainInviteTitle')} />
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
		this.init();
		this.resize();
	};

	componentDidUpdate (): void {
		this.init();
		this.resize();
	};

	init () {
		const data = UtilCommon.searchParam(UtilRouter.history.location.search);

		if ((this.cid == data.cid) && (this.key == data.key)) {
			return;
		};

		this.cid = data.cid;
		this.key = data.key;

		if (!data.cid || !data.key) {
			this.setState({ error: translate('pageMainInviteErrorData') });
		} else {
			C.SpaceInviteView(data.cid, data.key, (message: any) => {
				UtilSpace.openDashboard('route');
				window.setTimeout(() => {
					const space = UtilSpace.getSpaceviewBySpaceId(message.spaceId);

					if (message.error.code) {
						popupStore.open('confirm', {
							data: {
								icon: 'invite',
								bgColor: 'blue',
								title: translate('popupInviteRequestTitle'),
								text: translate('popupConfirmInviteError'),
								textConfirm: translate('commonOkay'),
								canCancel: false,
							},
						});
					} else 
					if (space && !space.isAccountDeleted) {
						popupStore.open('confirm', {
							data: {
								title: translate('popupConfirmDuplicateSpace'),
								textConfirm: translate('commonOpenSpace'),
								textCancel: translate('commonCancel'),
								onConfirm: () => {
									UtilRouter.switchSpace(message.spaceId);
								},
							},
						});
					} else {
						popupStore.open('inviteRequest', { data: { invite: message, ...data } });
					};
				}, popupStore.getTimeout());
			});
		};
	};

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const obj = UtilCommon.getPageContainer(isPopup);
		const node = $(this.node);
		const oh = obj.height();
		const header = node.find('#header');
		const hh = header.height();
		const wh = isPopup ? oh - hh : win.height();

		node.css({ height: wh, paddingTop: isPopup ? 0 : hh });
		this.refFrame.resize();
	};

};

export default PageMainInvite;
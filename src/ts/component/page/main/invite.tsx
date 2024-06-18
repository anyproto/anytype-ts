import * as React from 'react';
import { Loader, Title, Error, Frame, Button, Footer } from 'Component';
import { I, C, S, U, translate } from 'Lib';

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
								onClick={() => U.Space.openDashboard('route')} 
							/>
						</div>
					) : <Loader />}
				</Frame>

				<Footer component="mainObject" {...this.props} />
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
		const data = U.Common.searchParam(U.Router.history.location.search);

		if ((this.cid == data.cid) && (this.key == data.key)) {
			return;
		};

		this.cid = data.cid;
		this.key = data.key;

		if (!data.cid || !data.key) {
			this.setState({ error: translate('pageMainInviteErrorData') });
		} else {
			C.SpaceInviteView(data.cid, data.key, (message: any) => {
				U.Space.openDashboard('route');

				S.Popup.closeAll(null, () => {
					const space = U.Space.getSpaceviewBySpaceId(message.spaceId);

					if (message.error.code) {
						S.Popup.open('confirm', {
							data: {
								icon: 'sad',
								bgColor: 'red',
								title: translate('popupInviteRequestTitle'),
								text: translate('popupConfirmInviteError'),
								textConfirm: translate('commonOkay'),
								canCancel: false,
							},
						});
					} else 
					if (space) {
						if (space.isAccountJoining) {
							U.Common.onInviteRequest();
						} else
						if (!space.isAccountRemoving && !space.isAccountDeleted) {
							S.Popup.open('confirm', {
								data: {
									title: translate('popupConfirmDuplicateSpace'),
									textConfirm: translate('commonOpenSpace'),
									textCancel: translate('commonCancel'),
									onConfirm: () => {
										U.Router.switchSpace(message.spaceId);
									},
								},
							});
						} else {
							S.Popup.open('inviteRequest', { data: { invite: message, ...data } });
						};
					} else {
						S.Popup.open('inviteRequest', { data: { invite: message, ...data } });
					};
				});
			});
		};
	};

	resize () {
		const { isPopup } = this.props;
		const win = $(window);
		const obj = U.Common.getPageContainer(isPopup);
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
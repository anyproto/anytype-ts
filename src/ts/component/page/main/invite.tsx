import * as React from 'react';
import { Loader, Title, Error, Frame, Button } from 'Component';
import { I, C, UtilCommon, UtilRouter, UtilSpace, translate } from 'Lib';
import { popupStore } from 'Store';

interface State {
	error: string;
};

class PageMainImport extends React.Component<I.PageComponent, State> {

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
							<Button text={translate('commonBack')} className="c28" onClick={() => UtilSpace.openDashboard('route')} />
						</div>
					) : <Loader />}
				</Frame>
			</div>
		);
	};

	componentDidMount (): void {
		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	init () {
		const data = UtilCommon.searchParam(UtilRouter.history.location.search);
		const allowedStatuses = [ I.SpaceStatus.Deleted ];

		if ((this.cid == data.cid) && (this.key == data.key)) {
			return;
		};

		this.cid = data.cid;
		this.key = data.key;

		if (!data.cid || !data.key) {
			this.setState({ error: translate('pageMainInviteErrorData') });
		} else {
			C.SpaceInviteView(data.cid, data.key, (message: any) => {
				if (message.error.code) {
					this.setState({ error: message.error.description });
					return;
				};

				const space = UtilSpace.getSpaceviewBySpaceId(message.spaceId);
				if (space && !allowedStatuses.includes(space.spaceAccountStatus)) {
					this.setState({ error: UtilCommon.sprintf(translate('pageMainInviteErrorDuplicate'), UtilCommon.shorten(space.name, 32)) });
					return;
				};

				UtilSpace.openDashboard('route');
				window.setTimeout(() => popupStore.open('inviteRequest', { data: { invite: message, ...data } }), popupStore.getTimeout());
			});
		};

		this.resize();
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

export default PageMainImport;
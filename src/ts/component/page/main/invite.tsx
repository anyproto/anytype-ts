import * as React from 'react';
import { Loader, Title, Error, Frame, Button } from 'Component';
import { I, C, UtilCommon, UtilRouter, UtilSpace, keyboard, translate } from 'Lib';
import { popupStore } from 'Store';
import Constant from 'json/constant.json';

interface State {
	error: string;
};

class PageMainImport extends React.Component<I.PageComponent, State> {

	state = {
		error: '',
	};
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
					<Title text={translate('pageMainInviteTitle')} />
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
		const data = UtilCommon.searchParam(UtilRouter.history.location.search);
		const allowedStatuses = [ I.SpaceStatus.Deleted ];

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
					this.setState({ error: UtilCommon.sprintf(translate('pageMainInviteErrorDuplicate'), space.name) });
					return;
				};

				UtilSpace.openDashboard('route');
				window.setTimeout(() => popupStore.open('inviteRequest', { data: { invite: message, ...data } }), popupStore.getTimeout());
			});
		};

		this.resize();
	};

	componentDidUpdate (): void {
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
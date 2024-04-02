import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Button, Error, IconObject } from 'Component';
import { I, C, translate, UtilCommon, UtilSpace, UtilData, analytics } from 'Lib';
import { authStore } from 'Store';

interface State {
	error: string;
};

const PopupInviteConfirm = observer(class PopupInviteConfirm extends React.Component<I.Popup, State> {

	state = {
		error: '',
	};

	participants = [];

	constructor (props: I.Popup) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onReject = this.onReject.bind(this);
	};

	render() {
		const { error } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { icon } = data;
		const { membership } = authStore;
		const spaceId = this.getSpaceId();
		const space = UtilSpace.getSpaceviewBySpaceId(spaceId);
		const name = UtilCommon.shorten(String(data.name || translate('defaultNamePage')), 32);

		if (!space) {
			return null;
		};

		let readerButton = translate('popupInviteConfirmButtonReader');
		let writerButton = translate('popupInviteConfirmButtonEditor');

		if (!this.getWriterLimit()) {
			writerButton = translate('popupInviteConfirmButtonEditorLimit');
		} else
		if (!this.getReaderLimit() && (membership.tier == I.MembershipTier.Explorer)) {
			readerButton = translate('popupInviteConfirmButtonReaderLimit');
			writerButton = translate('popupInviteConfirmButtonEditorLimit');
		};

		return (
			<React.Fragment>
				<div className="iconWrapper">
					<IconObject object={{ name, iconImage: icon, layout: I.ObjectLayout.Participant }} size={48} />
				</div>

				<Title text={UtilCommon.sprintf(translate('popupInviteConfirmTitle'), name, UtilCommon.shorten(space.name, 32))} />

				<div className="buttons">
					<div className="sides">
						<Button onClick={() => this.onConfirm(I.ParticipantPermissions.Reader)} text={readerButton} className="c36" />
						<Button onClick={() => this.onConfirm(I.ParticipantPermissions.Writer)} text={writerButton} className="c36" />
					</div>

					<Button onClick={this.onReject} text={translate('popupInviteConfirmButtonReject')} className="c36" color="red" />
				</div>

				<Error text={error} />
			</React.Fragment>
		);
	};

	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { route } = data;

		analytics.event('ScreenInviteConfirm', { route });
		this.load();
	};

	onConfirm (permissions: I.ParticipantPermissions) {
		const { param, close } = this.props;
		const { data } = param;
		const { identity } = data;
		const spaceId = this.getSpaceId();

		if (!spaceId || !identity) {
			return;
		};

		C.SpaceRequestApprove(spaceId, identity, permissions, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			analytics.event('ApproveInviteRequest', { type: permissions });

			close();
		});
	};

	onReject () {
		const { param, close } = this.props;
		const { data } = param;
		const { spaceId, identity } = data;

		if (!spaceId || !identity) {
			return;
		};

		C.SpaceRequestDecline(spaceId, identity, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			analytics.event('RejectInviteRequest');

			close();
		});
	};

	load () {
		const { param } = this.props;
		const { data } = param;
		const { spaceId } = data;

		UtilData.search({
			keys: UtilData.participantRelationKeys(),
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
				{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: spaceId },
			],
			ignoreWorkspace: true,
			ignoreDeleted: true,
			noDeps: true,
		}, (message: any) => {
			this.participants = message.records || [];
			this.forceUpdate();
		});
	};

	getSpaceId () {
		return this.props.param.data.spaceId;
	};

	getReaderLimit () {
		const space = UtilSpace.getSpaceviewBySpaceId(this.getSpaceId());
		if (!space) {
			return 0;
		};

		const participants = this.participants.filter(it => it.isActive);
		return space.readersLimit - participants.length;
	};

	getWriterLimit () {
		const space = UtilSpace.getSpaceviewBySpaceId(this.getSpaceId());
		if (!space) {
			return 0;
		};

		const participants = this.participants.filter(it => it.isActive && (it.isWriter || it.isOwner));
		return space.writersLimit - participants.length;
	};

});

export default PopupInviteConfirm;

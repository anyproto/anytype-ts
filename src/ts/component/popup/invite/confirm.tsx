import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Button, Error, IconObject } from 'Component';
import { I, C, translate, UtilCommon, UtilSpace, UtilData, analytics } from 'Lib';
import { authStore, popupStore } from 'Store';
const Constant = require('json/constant.json');

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
		this.onMembership = this.onMembership.bind(this);
	};

	render() {
		const { error } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { icon } = data;
		const { membership } = authStore;
		const space = UtilSpace.getSpaceviewBySpaceId(this.getSpaceId());
		const name = UtilCommon.shorten(String(data.name || translate('defaultNamePage')), 32);

		if (!space) {
			return null;
		};

		let buttons = [];
		if (!this.getReaderLimit() && membership.isExplorer) {
			buttons.push({ text: translate('popupInviteConfirmButtonReaderLimit'), onClick: () => this.onMembership('members') });
		} else 
		if (!this.getWriterLimit()) {
			buttons = buttons.concat([
				{ text: translate('popupInviteConfirmButtonReader'), onClick: () => this.onConfirm(I.ParticipantPermissions.Reader) },
				{ text: translate('popupInviteConfirmButtonWriterLimit'), onClick: () => this.onMembership('editors') },
			]);
		} else {
			buttons = buttons.concat([
				{ text: translate('popupInviteConfirmButtonReader'), onClick: () => this.onConfirm(I.ParticipantPermissions.Reader) },
				{ text: translate('popupInviteConfirmButtonWriter'), onClick: () => this.onConfirm(I.ParticipantPermissions.Writer) },
			]);
		};

		return (
			<React.Fragment>
				<div className="iconWrapper">
					<IconObject object={{ name, iconImage: icon, layout: I.ObjectLayout.Participant }} size={48} />
				</div>

				<Title text={UtilCommon.sprintf(translate('popupInviteConfirmTitle'), name, UtilCommon.shorten(space.name, 32))} />

				<div className="buttons">
					<div className="sides">
						{buttons.map((item: any, i: number) => <Button key={i} {...item} className="c36" />)}
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

	onMembership (type: string) {
		popupStore.closeAll(null, () => {
			popupStore.open('settings', { data: { page: 'membership' } })
		});

		analytics.event('ClickUpgradePlanTooltip', { type, route: analytics.route.inviteConfirm });
	};

	onConfirm (permissions: I.ParticipantPermissions) {
		C.SpaceRequestApprove(this.getSpaceId(), this.getIdentity(), permissions, (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			analytics.event('ApproveInviteRequest', { type: permissions });
			this.props.close();
		});
	};

	onReject () {
		C.SpaceRequestDecline(this.getSpaceId(), this.getIdentity(), (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
				return;
			};

			analytics.event('RejectInviteRequest');
			this.props.close();
		});
	};

	load () {
		UtilData.search({
			keys: UtilData.participantRelationKeys(),
			filters: [
				{ operator: I.FilterOperator.And, relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
				{ operator: I.FilterOperator.And, relationKey: 'spaceId', condition: I.FilterCondition.Equal, value: this.getSpaceId() },
			],
			ignoreHidden: false,
			ignoreWorkspace: true,
			ignoreDeleted: true,
			noDeps: true,
		}, (message: any) => {
			this.participants = message.records || [];
			this.forceUpdate();
		});
	};

	getSpaceId () {
		return String(this.props.param.data?.spaceId || '');
	};

	getIdentity () {
		return String(this.props.param.data?.identity || '');
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

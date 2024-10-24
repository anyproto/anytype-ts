import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Button, Error, IconObject, Loader } from 'Component';
import { I, C, S, U, translate, analytics } from 'Lib';

interface State {
	error: string;
	isLoading: boolean;
};

const PopupInviteConfirm = observer(class PopupInviteConfirm extends React.Component<I.Popup, State> {

	state = {
		error: '',
		isLoading: false,
	};

	buttonRefs: Map<string, any> = new Map();
	participants = [];

	constructor (props: I.Popup) {
		super(props);

		this.onConfirm = this.onConfirm.bind(this);
		this.onReject = this.onReject.bind(this);
		this.onMembership = this.onMembership.bind(this);
	};

	render() {
		const { error, isLoading } = this.state;
		const { param } = this.props;
		const { data } = param;
		const { icon } = data;
		const { membership } = S.Auth;
		const space = U.Space.getSpaceviewBySpaceId(this.getSpaceId());
		const name = U.Common.shorten(String(data.name || translate('defaultNamePage')), 32);

		if (!space) {
			return null;
		};

		let buttons = [];
		if (!this.getReaderLimit() && membership.isExplorer) {
			buttons.push({ id: 'reader', text: translate('popupInviteConfirmButtonReaderLimit'), onClick: () => this.onMembership('members') });
		} else 
		if (!this.getWriterLimit()) {
			buttons = buttons.concat([
				{ id: 'reader', text: translate('popupInviteConfirmButtonReader'), onClick: () => this.onConfirm(I.ParticipantPermissions.Reader) },
				{ id: 'writer', text: translate('popupInviteConfirmButtonWriterLimit'), onClick: () => this.onMembership('editors') },
			]);
		} else {
			buttons = buttons.concat([
				{ id: 'reader', text: translate('popupInviteConfirmButtonReader'), onClick: () => this.onConfirm(I.ParticipantPermissions.Reader) },
				{ id: 'writer', text: translate('popupInviteConfirmButtonWriter'), onClick: () => this.onConfirm(I.ParticipantPermissions.Writer) },
			]);
		};

		return (
			<React.Fragment>
				{isLoading ? <Loader id="loader" /> : ''}

				<div className="iconWrapper">
					<IconObject object={{ name, iconImage: icon, layout: I.ObjectLayout.Participant }} size={48} />
				</div>

				<Title text={U.Common.sprintf(translate('popupInviteConfirmTitle'), name, U.Common.shorten(space.name, 32))} />

				<div className="buttons">
					<div className="sides">
						{buttons.map((item: any, i: number) => <Button ref={ref => this.buttonRefs.set(item.id, ref)} key={i} {...item} className="c36" />)}
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
		S.Popup.closeAll(null, () => {
			S.Popup.open('settings', { data: { page: 'membership' } });
		});

		analytics.event('ClickUpgradePlanTooltip', { type, route: analytics.route.inviteConfirm });
	};

	onConfirm (permissions: I.ParticipantPermissions) {
		this.setLoading(true);

		C.SpaceRequestApprove(this.getSpaceId(), this.getIdentity(), permissions, (message: any) => {
			if (message.error.code) {
				this.setError(message.error.description);
				return;
			};

			analytics.event('ApproveInviteRequest', { type: permissions });
			this.setLoading(false);
			this.props.close();
		});
	};

	onReject () {
		this.setLoading(true);

		C.SpaceRequestDecline(this.getSpaceId(), this.getIdentity(), (message: any) => {
			if (message.error.code) {
				this.setError(message.error.description);
				return;
			};

			analytics.event('RejectInviteRequest');
			this.setLoading(false);
			this.props.close();
		});
	};

	setLoading (isLoading: boolean) {
		this.setState({ isLoading });
	};

	setError (error: string) {
		this.setState({ error, isLoading: false });
	};

	load () {
		this.setLoading(true);

		U.Data.search({
			spaceId: this.getSpaceId(),
			keys: U.Data.participantRelationKeys(),
			filters: [
				{ relationKey: 'layout', condition: I.FilterCondition.Equal, value: I.ObjectLayout.Participant },
			],
			ignoreHidden: false,
			ignoreDeleted: true,
			noDeps: true,
		}, (message: any) => {
			this.participants = message.records || [];
			this.setLoading(false);
		});
	};

	getSpaceId () {
		return String(this.props.param.data?.spaceId || '');
	};

	getIdentity () {
		return String(this.props.param.data?.identity || '');
	};

	getReaderLimit () {
		const space = U.Space.getSpaceviewBySpaceId(this.getSpaceId());
		if (!space) {
			return 0;
		};

		const participants = this.participants.filter(it => it.isActive);
		return space.readersLimit - participants.length;
	};

	getWriterLimit () {
		const space = U.Space.getSpaceviewBySpaceId(this.getSpaceId());
		if (!space) {
			return 0;
		};

		const participants = this.participants.filter(it => it.isActive && (it.isWriter || it.isOwner));
		return space.writersLimit - participants.length;
	};

});

export default PopupInviteConfirm;

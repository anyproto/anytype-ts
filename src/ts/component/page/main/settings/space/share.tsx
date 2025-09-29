import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Input, Button, Error, UpsellBanner } from 'Component';
import { I, C, S, U, translate, Preview, Action, analytics } from 'Lib';
import Members from './share/members';

interface State {
	isLoading: boolean;
	error: string;
	cid: string;
	key: string;
	type: I.InviteLinkType;
};

const PageMainSettingsSpaceShare = observer(class PageMainSettingsSpaceShare extends React.Component<I.PageSettingsComponent, State> {

	node: any = null;
	top = 0;
	refInput = null;
	refCopy: any = null;

	state = {
		isLoading: false,
		error: '',
		cid: '',
		key: '',
		type: I.InviteLinkType.None,
	};

	constructor (props: I.PageSettingsComponent) {
		super(props);

		this.onInviteMenu = this.onInviteMenu.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onMoreLink = this.onMoreLink.bind(this);
		this.onUpgrade = this.onUpgrade.bind(this);
		this.onStopSharing = this.onStopSharing.bind(this);
	};

	render () {
		const { isLoading, error, cid, key, type } = this.state;
		const { icon, name, description } = this.getOptionById(type);
		const hasLink = cid && key;

		return (
			<div ref={node => this.node = node}>
				<div>
					<UpsellBanner components={[ 'members', 'space'  ]} route={analytics.route.settingsSpaceShare} />
				</div>

				<div id="titleWrapper" className="titleWrapper">
					<Title text={translate('popupSettingsSpaceShareTitle')} />
				</div>

				<div id="sectionInvite" className="section sectionInvite">
					<Title text={translate('popupSettingsSpaceShareInviteLinkTitle')} />

					<div id="linkTypeWrapper" className={[ 'linkTypeWrapper', this.canEdit() ? 'canEdit' : '' ].join(' ')} onClick={this.onInviteMenu}>
						<Icon className={isLoading ? 'loading' : icon} />
						<div className="info">
							<Title text={name} />
							<Label text={description} />
						</div>
					</div>

					{hasLink ? (
						<div className="inviteLinkWrapper">
							<div className="inputWrapper">
								<Input ref={ref => this.refInput = ref} readonly={true} value={U.Space.getInviteLink(cid, key)} onClick={() => this.refInput?.select()} />
								<Icon id="button-more-link" className="more withBackground" onClick={this.onMoreLink} />
							</div>
							<Button ref={ref => this.refCopy = ref} onClick={this.onCopy} className="c36" color="black" text={translate('commonCopy')} />
						</div>
					) : ''}
				</div>

				<Members {...this.props} onStopSharing={this.onStopSharing} />

				<Error text={error} />
			</div>
		);
	};

	componentDidMount () {
		this.init();
	};

	init () {
		const { cid, key } = this.state;
		const space = U.Space.getSpaceview();

		if (space.isShared && !cid && !key) {
			U.Space.getInvite(S.Common.space, (cid: string, key: string, inviteType: I.InviteType, permissions: I.ParticipantPermissions) => {
				if (cid && key) {
					this.setInvite(cid, key, inviteType, permissions);
				};
			});
		};
	};

	setInvite (cid: string, key: string, inviteType: I.InviteType, permissions: I.ParticipantPermissions) {
		let type = I.InviteLinkType.None;

		if (cid && key) {
			if (inviteType == I.InviteType.WithApprove) {
				type = I.InviteLinkType.Manual;
			} else {
				switch (permissions) {
					case I.ParticipantPermissions.Writer: {
						type = I.InviteLinkType.Editor;
						break;
					};

					case I.ParticipantPermissions.Reader: {
						type = I.InviteLinkType.Viewer;
						break;
					};
				};
			};
		};

		this.setState({ cid, key, type });
		this.refInput?.setValue(U.Space.getInviteLink(cid, key));
	};

	onUpgrade (type: string) {
		Action.membershipUpgrade();

		analytics.event('ClickUpgradePlanTooltip', { type, route: analytics.route.settingsSpaceShare });
	};

	onInviteMenu () {
		if (!this.canEdit()) {
			return;
		};

		const { isOnline } = S.Common;
		const isLocalNetwork = U.Data.isLocalNetwork();
		const space = U.Space.getSpaceview();
		const noApproveIds: I.InviteLinkType[] = [
			I.InviteLinkType.Editor,
			I.InviteLinkType.Viewer
		];
		const ids: I.InviteLinkType[] = noApproveIds.concat([ I.InviteLinkType.Manual ]);

		const options: any[] = ids.map((id: I.InviteLinkType) => this.getOptionById(id));

		if (isOnline && !isLocalNetwork) {
			if (options.length) {
				options.push({ isDiv: true });
			};
			options.push(this.getOptionById(I.InviteLinkType.None));
		};

		S.Menu.open('select', {
			element: '#linkTypeWrapper',
			className: 'inviteLinkType',
			classNameWrap: 'fromBlock',
			offsetX: 60,
			offsetY: -26,
			data: {
				options,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					const id = Number(item.id);

					if (id == this.state.type) {
						return;
					};

					let created = false;
					let inviteType = I.InviteType.WithoutApprove;
					let permissions = I.ParticipantPermissions.Reader;

					if (id == I.InviteLinkType.None) {
						Action.inviteRevoke(S.Common.space, () => {
							this.setInvite('', '', inviteType, permissions);
						});
						return;
					};

					this.setState({ isLoading: true, error: '' });

					const callBack = () => {
						switch (id) {
							case I.InviteLinkType.Editor: {
								permissions = I.ParticipantPermissions.Writer;
								break;
							};

							case I.InviteLinkType.Manual: {
								inviteType = I.InviteType.WithApprove;
								break;
							};
						};

						const isChange = noApproveIds.includes(this.state.type) && noApproveIds.includes(id);

						if (isChange) {
							C.SpaceInviteChange(S.Common.space, permissions, (message: any) => {
								this.setState({ isLoading: false });
								if (this.setError(message.error)) {
									return;
								};

								this.setInvite(this.state.cid, this.state.key, inviteType, permissions);

								Preview.toastShow({ text: U.Common.sprintf(translate('toastInviteUpdate'), item.name) });
							});
						} else {
							C.SpaceInviteGenerate(S.Common.space, inviteType, permissions, (message: any) => {
								this.setState({ isLoading: false });

								if (this.setError(message.error)) {
									return;
								};

								let toast = '';
								if (created) {
									toast = translate('toastInviteGenerate');
								} else {
									toast = U.Common.sprintf(translate('toastInviteUpdate'), item.name);
								};

								this.setInvite(message.inviteCid, message.inviteKey, inviteType, permissions);
								Preview.toastShow({ text: toast });

								if (!space.isShared) {
									analytics.event('ShareSpace');
								};
							});
						};

						analytics.event('ClickShareSpaceNewLink', { type: id});
					};

					if (!space.isShared) {
						created = true;

						C.SpaceMakeShareable(S.Common.space, (message: any) => {
							if (this.setError(message.error)) {
								return;
							};

							callBack();
						});
					} else {
						callBack();
					};
				},
			}
		});

		analytics.event('ScreenShareMenu');
	};

	isSharedSpacesLimit () {
		const mySharedSpaces = U.Space.getMySharedSpacesList();
		const { sharedSpacesLimit } = U.Space.getProfile();

		return sharedSpacesLimit && (mySharedSpaces.length >= sharedSpacesLimit);
	};

	getOptionById (id: I.InviteLinkType) {
		const isWriterLimit = U.Space.getWriterLimit() <= 0;
		const isDisabled = (id == I.InviteLinkType.Editor) && isWriterLimit;
		const suffix = I.InviteLinkType[id];

		return {
			id: String(id),
			icon: suffix.toLowerCase(),
			name: translate(`popupSettingsSpaceShareMenuInvite${suffix}Title`),
			description: translate(`popupSettingsSpaceShareMenuInvite${suffix}Description`),
			withDescription: true,
			disabled: isDisabled
		};
	};

	onCopy () {
		const { cid, key } = this.state;
		if (!cid || !key) {
			return;
		};

		U.Common.copyToast('', U.Space.getInviteLink(cid, key), translate('toastInviteCopy'));
		analytics.event('ClickShareSpaceCopyLink');
	};

	onMoreLink () {
		const { getId } = this.props;
		const { cid, key } = this.state;

		U.Menu.inviteContext({
			containerId: getId(),
			cid,
			key,
		});
	};

	onStopSharing () {
		C.SpaceStopSharing(S.Common.space, (message) => {
			if (!message.error.code) {
				this.setInvite('', '', I.InviteType.WithoutApprove, I.ParticipantPermissions.Reader);
				
				S.Popup.open('confirm', {
					data: {
						icon: 'warning',
						title: translate(`popupConfirmStopSharingSpaceTitle`),
						text: translate(`popupConfirmStopSharingSpaceText`),
						textConfirm: translate('commonOkay'),
						canCancel: false,
					}
				});
			};
		});
	};

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		this.setState({ error: error.description });
		return true;
	};

	canEdit () {
		const { cid, key } = this.state;
		const hasLink = cid && key;
		const space = U.Space.getSpaceview();

		return U.Space.isMyOwner() && (!hasLink || space.isShared);
	};

});

export default PageMainSettingsSpaceShare;

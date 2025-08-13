import * as React from 'react';
import { observer } from 'mobx-react';
import { Title, Label, Icon, Input, Button, Error } from 'Component';
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
	};

	render () {
		const { isLoading, error, cid, key, type } = this.state;
		const { icon, name, description } = this.getOptionById(type);
		const hasLink = cid && key;

		return (
			<div ref={node => this.node = node}>
				<div id="titleWrapper" className="titleWrapper">
					<Title text={translate('popupSettingsSpaceShareTitle')} />
				</div>

				<div id="sectionInvite" className="section sectionInvite">
					<Title text={translate('popupSettingsSpaceShareInviteLinkTitle')} />

					<div id="linkTypeWrapper" className={[ 'linkTypeWrapper', U.Space.isMyOwner() ? 'canEdit' : '' ].join(' ')} onClick={this.onInviteMenu}>
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

				<Members {...this.props} />

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
	};

	onUpgrade (type: string) {
		Action.membershipUpgrade();

		analytics.event('ClickUpgradePlanTooltip', { type, route: analytics.route.settingsSpaceShare });
	};

	onInviteMenu () {
		if (!U.Space.isMyOwner()) {
			return;
		};

		const { config } = S.Common;
		const { isOnline } = S.Common;
		const isLocalNetwork = U.Data.isLocalNetwork();
		const space = U.Space.getSpaceview();
		const noApproveIds: I.InviteLinkType[] = [ I.InviteLinkType.Editor, I.InviteLinkType.Viewer ];

		let ids: I.InviteLinkType[] = [ I.InviteLinkType.Manual ];
		if (config.experimental) {
			ids = noApproveIds.concat(ids);
		};

		const options: any[] = ids.map((id: I.InviteLinkType) => this.getOptionById(id));

		if (isOnline && !isLocalNetwork) {
			options.push({ isDiv: true });
			options.push(this.getOptionById(I.InviteLinkType.None));
		};

		S.Menu.open('select', {
			element: '#linkTypeWrapper',
			className: 'inviteLinkType',
			offsetX: 60,
			offsetY: -26,
			data: {
				options,
				noVirtualisation: true,
				onSelect: (e: any, item: any) => {
					let created = false;
					let inviteType = I.InviteType.WithoutApprove;
					let permissions = I.ParticipantPermissions.Reader;

					if (item.id == I.InviteLinkType.None) {
						Action.inviteRevoke(S.Common.space, () => {
							this.setInvite('', '', inviteType, permissions);
						});
						return;
					};

					this.setState({ isLoading: true });

					const callBack = () => {
						switch (Number(item.id)) {
							case I.InviteLinkType.Editor: {
								permissions = I.ParticipantPermissions.Writer;
								break;
							};

							case I.InviteLinkType.Manual: {
								inviteType = I.InviteType.WithApprove;
								break;
							};
						};

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

							analytics.event('ClickShareSpaceNewLink', { type: item.id});
						});
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

	getOptionById (id) {
		const suffix = I.InviteLinkType[id];

		return {
			id: String(id),
			icon: suffix.toLowerCase(),
			name: translate(`popupSettingsSpaceShareMenuInvite${suffix}Title`),
			description: translate(`popupSettingsSpaceShareMenuInvite${suffix}Description`),
			withDescription: true,
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

	setError (error: { description: string, code: number}) {
		if (!error.code) {
			return false;
		};

		this.setState({ error: error.description });
		return true;
	};

});

export default PageMainSettingsSpaceShare;

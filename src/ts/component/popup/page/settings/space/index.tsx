import * as React from 'react';
import { Icon, Title, Label, Input, IconObject, Button, ProgressBar, Error, ObjectName } from 'Component';
import { I, C, UtilObject, UtilMenu, UtilCommon, UtilFile, translate, Preview, analytics, UtilDate, Action, UtilSpace } from 'Lib';
import { observer } from 'mobx-react';
import { menuStore, commonStore, authStore, dbStore, detailStore, popupStore } from 'Store';
const Constant = require('json/constant.json');

interface State {
	error: string;
	cid: string;
	key: string;
};

const STORAGE_FULL = 0.7;

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PopupSettings, State> {

	refName: any = null;
	refInput = null;
	refCopy: any = null;

	state = {
		error: '',
		cid: '',
		key: '',
	};

	constructor (props: any) {
		super(props);

		this.onDashboard = this.onDashboard.bind(this);
		this.onType = this.onType.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onName = this.onName.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onUpgrade = this.onUpgrade.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onMoreLink = this.onMoreLink.bind(this);
	};

	render () {
		const { onPage, onSpaceTypeTooltip } = this.props;
		const { error, cid, key } = this.state;
		const { spaceStorage, isOnline } = commonStore;
		const { localUsage, bytesLimit } = spaceStorage;
		const { account, accountSpaceId } = authStore;
		const spaces = UtilSpace.getList();
		const space = UtilSpace.getSpaceview();
		const creator = detailStore.get(Constant.subId.space, space.creator);
		const home = UtilSpace.getDashboard();
		const type = dbStore.getTypeById(commonStore.type);
		const personalSpace = UtilSpace.getSpaceviewBySpaceId(accountSpaceId);
		const usageCn = [ 'item' ];

		const requestCnt = this.getRequestCnt();
		const sharedCnt = this.getSharedCnt();

		const hasLink = cid && key;
		const isOwner = UtilSpace.isMyOwner();
		const canWrite = UtilSpace.canMyParticipantWrite();
		const canDelete = space.targetSpaceId != accountSpaceId;
		const isShareActive = UtilSpace.isShareActive();

		let bytesUsed = 0;
		let buttonUpgrade = null;
		let requestCaption = null;
		let canShare = isOwner && !space.isPersonal;
		let canMembers = !isOwner && space.isShared;

		const progressSegments = (spaces || []).map(space => {
			const object: any = commonStore.spaceStorage.spaces.find(it => it.spaceId == space.targetSpaceId) || {};
			const usage = Number(object.bytesUsage) || 0;
			const isOwner = UtilSpace.isMyOwner(space.targetSpaceId);

			if (!isOwner) {
				return null;
			};

			bytesUsed += usage;
			return { name: space.name, caption: UtilFile.size(usage), percent: usage / bytesLimit, isActive: space.isActive };
		}).filter(it => it);
		const isRed = (bytesUsed / bytesLimit >= STORAGE_FULL) || (localUsage > bytesLimit);

		if (personalSpace && (sharedCnt >= personalSpace.sharedSpacesLimit) && !space.isShared) {
			canShare = false;
			canMembers = false;
		};

		if (isRed) {
			usageCn.push('red');
			buttonUpgrade = <Button className="payment" text={translate('popupSettingsSpaceIndexRemoteStorageUpgradeText')} onClick={this.onUpgrade} />
		};

		if (requestCnt) {
			requestCaption = <Label text={UtilCommon.sprintf('%d %s', requestCnt, UtilCommon.plural(requestCnt, translate('pluralRequest')))} className="caption" />;
		};

		return (
			<React.Fragment>
				<div className="spaceHeader">
					<div className="iconWrapper">
						<IconObject
							id="spaceIcon"
							size={96}
							object={space}
							forceLetter={true}
							canEdit={canWrite}
							menuParam={{ horizontal: I.MenuDirection.Center }}
							onSelect={this.onSelect}
							onUpload={this.onUpload}
						/>
					</div>

					<div className="headerContent">
						<div className="name">
							<Input
								ref={ref => this.refName = ref}
								value={this.checkName(space.name)}
								onKeyUp={this.onName}
								placeholder={translate('defaultNamePage')}
								readonly={!canWrite}
							/>
						</div>
						<div className="info">
							<Label
								className="infoLabel spaceAccessType"
								text={translate(`spaceAccessType${space.spaceAccessType}`)}
							/>
							<div className="bullet" />
							<Label 
								className="infoLabel withTooltip"
								text={translate('popupSettingsSpaceIndexInfoLabel')} 
								onMouseEnter={onSpaceTypeTooltip}
								onMouseLeave={e => Preview.tooltipHide(false)}
							/>
						</div>
					</div>
				</div>

				<div className="sections">
					<div 
						className="section sectionSpaceShare"
						onMouseEnter={isShareActive ? () => {} : e => Preview.tooltipShow({ text: translate('popupSettingsSpaceShareGenerateInviteDisabled'), element: $(e.currentTarget) })}
						onMouseLeave={e => Preview.tooltipHide(false)}
					>
						<Title text={translate(`popupSettingsSpaceShareTitle`)} />

						<div className="sectionContent">

							{space.isPersonal ? (
								<div className="item isDefault">
									<div className="sides">
										<div className="side left">
											<Title text={translate('popupSettingsSpaceIndexShareShareTitle')} />
											<Label text={translate('popupSettingsSpaceIndexShareDefaultText')} />
										</div>
										<div className="side right">
											<Icon className="arrow" />
										</div>
									</div>
								</div>
							) : ''}

							{canShare && !space.isShared ? (
								<div 
									className={[ 'item', (isShareActive ? '' : 'disabled') ].join(' ')} 
									onClick={() => isShareActive ? onPage('spaceShare') : null}
								>
									<div className="sides">
										<div className="side left">
											<Title text={translate('popupSettingsSpaceIndexShareShareTitle')} />
											<Label text={translate('popupSettingsSpaceIndexShareInviteText')} />
										</div>
										<div className="side right">
											<Icon className="arrow" />
										</div>
									</div>
								</div>
							) : ''}

							{hasLink ? (
								<div className="item isInvite">
									<div className="sides">
										<div className="side left">
											<Title text={translate('popupSettingsSpaceIndexShareLinkTitle')} />
											<Label text={translate('popupSettingsSpaceIndexShareLinkText')} />
										</div>
										<div className="side right">
											<Button ref={ref => this.refCopy = ref} onClick={this.onCopy} className="c28" color="blank" text={translate('commonCopyLink')} />
										</div>
									</div>

									<div className="inviteLinkWrapper">
										<div className="inputWrapper">
											<Input ref={ref => this.refInput = ref} readonly={true} value={UtilSpace.getInviteLink(cid, key)} onClick={() => this.refInput?.select()} />
											<Icon id="button-more-link" className="more" onClick={this.onMoreLink} />
										</div>
									</div>
								</div>
							) : ''}

							{canShare && space.isShared ? (
								<div 
									className={[ 'item', (isShareActive ? '' : 'disabled') ].join(' ')} 
									onClick={() => isShareActive ? onPage('spaceShare') : null}
								>
									<div className="sides">
										<div className="side left">
											<Title text={translate('popupSettingsSpaceIndexShareMembersTitle')} />
											<Label text={translate('popupSettingsSpaceIndexShareMembersManageText')} />
										</div>
										<div className="side right">
											{requestCaption}
											<Icon className="arrow" />
										</div>
									</div>
								</div>
							) : ''}

							{canMembers ? (
								<div 
									className={[ 'item', (isShareActive ? '' : 'disabled') ].join(' ')} 
									onClick={() => isShareActive ? onPage('spaceMembers') : null}
								>
									<div className="sides">
										<div className="side left">
											<Title text={translate('popupSettingsSpaceIndexShareMembersTitle')} />
											<Label text={translate('popupSettingsSpaceIndexShareMembersViewText')} />
										</div>
										<div className="side right">
											<Icon className="arrow" />
										</div>
									</div>
								</div>
							) : ''}

							<div className="item isOwner">
								<div className="sides">
									<div className="side left">
										<Title text={translate('commonOwner')} />
									</div>
									<div className="side right">
										<IconObject object={creator} size={24} />
										<ObjectName object={creator} />
										{creator.identity == account.id ? <div className="caption">({translate('commonYou')})</div> : ''}
									</div>
								</div>
							</div>
						</div>
					</div>

					{canWrite ? (
						<div className="section sectionSpaceManager">
							<Title text={translate(`popupSettingsSpaceIndexManageSpaceTitle`)} />
							<div className="sectionContent">

								{isOwner ? (
									<div className={usageCn.join(' ')}>
										<div className="sides alignTop">
											<div className="side left">
												<Title text={translate(`popupSettingsSpaceIndexRemoteStorageTitle`)} />
												<div className="storageLabel">
													<Label text={UtilCommon.sprintf(translate(`popupSettingsSpaceIndexStorageText`), UtilFile.size(bytesLimit))} />
												</div>
											</div>
											<div className="side right">
												{canWrite ? (
													<Button 
														onClick={() => onPage('spaceStorageManager')} 
														text={translate('popupSettingsSpaceIndexStorageManageFiles')} 
														color="blank" 
														className="c28" 
													/>
												) : ''}
											</div>
										</div>

										<ProgressBar segments={progressSegments} current={UtilFile.size(bytesUsed)} max={UtilFile.size(bytesLimit)} />

										{buttonUpgrade}
									</div>
								) : ''}

								<div className="item">
									<div className="sides">
										<div className="side left">
											<Title text={translate('commonHomepage')} />
											<Label text={translate('popupSettingsSpaceIndexHomepageDescription')} />
										</div>

										<div className="side right">
											<div id="empty-dashboard-select" className="select" onClick={this.onDashboard}>
												<div className="item">
													<div className="name">{home ? home.name : translate('commonSelect')}</div>
												</div>
												<Icon className="arrow black" />
											</div>
										</div>
									</div>
								</div>

								<div className="item">
									<div className="sides">
										<div className="side left">
											<Title text={translate('popupSettingsPersonalDefaultObjectType')} />
											<Label text={translate('popupSettingsPersonalDefaultObjectTypeDescription')} />
										</div>

										<div className="side right">
											<div id="defaultType" className="select" onClick={this.onType}>
												<div className="item">
													<div className="name">{type?.name || translate('commonSelect')}</div>
												</div>
												<Icon className="arrow black" />
											</div>
										</div>
									</div>
								</div>

							</div>
						</div>
					) : ''}	

					<div className="section sectionIntegrations">
						<Title text={translate(`popupSettingsSpaceIndexIntegrations`)} />
						<div className="sectionContent">

							{canWrite ? (
								<div className="item" onClick={() => onPage('importIndex')}>
									<div className="sides">
										<div className="side left">
											<Icon className="settings-import" />
											<Title text={translate(`popupSettingsSpaceIndexImport`)} />
										</div>
										<div className="side right">
											<Icon className="arrow" />
										</div>
									</div>
								</div>
							) : ''}

							<div className="item" onClick={() => onPage('exportIndex')}>
								<div className="sides">
									<div className="side left">
										<Icon className="settings-export" />
										<Title text={translate(`popupSettingsSpaceIndexExport`)} />
									</div>
									<div className="side right">
										<Icon className="arrow" />
									</div>
								</div>
							</div>

						</div>
					</div>

					<div className="section sectionInfo">
						<Title text={translate(`popupSettingsSpaceIndexSpaceInfoTitle`)} />

						<div className="sectionContent">

							<div
								className="item"
								onClick={() => UtilCommon.copyToast(translate(`popupSettingsSpaceIndexSpaceIdTitle`), space.targetSpaceId)}
							>
								<div className="sides">
									<div className="side left">
										<Title text={translate(`popupSettingsSpaceIndexSpaceIdTitle`)} />
										<Label text={space.targetSpaceId} />
									</div>
									<div className="side right">
										<Icon className="copy" />
									</div>
								</div>
							</div>

							<div 
								className="item" 
								onClick={() => UtilCommon.copyToast(translate('popupSettingsAccountAnytypeIdentityTitle'), account.id)}
							>
								<div className="sides">
									<div className="side left">
										<Title text={translate(`popupSettingsSpaceIndexCreatedByTitle`)} />
										<Label text={creator.globalName || creator.identity} />
									</div>
									<div className="side right">
										<Icon className="copy" />
									</div>
								</div>
							</div>

							<div
								className="item"
								onClick={() => UtilCommon.copyToast(translate(`popupSettingsSpaceIndexNetworkIdTitle`), account.info.networkId)}
							>
								<div className="sides">
									<div className="side left">
										<Title text={translate(`popupSettingsSpaceIndexNetworkIdTitle`)} />
										<Label text={account.info.networkId} />
									</div>
									<div className="side right">
										<Icon className="copy" />
									</div>
								</div>
							</div>

							{space.createdDate ? (
								<div className="item">
									<div className="sides">
										<div className="side left">
											<Title text={translate(`popupSettingsSpaceIndexCreationDateTitle`)} />
											<Label text={UtilDate.date(UtilDate.dateFormat(I.DateFormat.MonthAbbrBeforeDay), space.createdDate)} />
										</div>
									</div>
								</div>
							) : ''}
						</div>
					</div>

					{canDelete ? (
						<div className="buttons">
							<Button text={isOwner ? translate('commonDelete') : translate('commonLeaveSpace')} color="red" onClick={this.onDelete} />
						</div>
					) : ''}

					<Error text={error} />
				</div>

			</React.Fragment>
		);
	};

	componentDidMount (): void {
		this.init();
	};

	componentDidUpdate (): void {
		this.init();
	};

	componentWillUnmount(): void {
		menuStore.closeAll([ 'select', 'searchObject' ]);
	};

	init () {
		const { cid, key } = this.state;
		const space = UtilSpace.getSpaceview();

		if (space.isShared && !cid && !key) {
			C.SpaceInviteGetCurrent(commonStore.space, (message: any) => {
				if (!message.error.code) {
					this.setInvite(message.inviteCid, message.inviteKey);
				};
			});
		};
	};

	setInvite (cid: string, key: string) {
		this.setState({ cid, key });
	};

	onDashboard () {
		UtilMenu.dashboardSelect(`#${this.props.getId()} #empty-dashboard-select`);
	};

	onType (e: any) {
		const { getId } = this.props;

		menuStore.open('typeSuggest', {
			element: `#${getId()} #defaultType`,
			horizontal: I.MenuDirection.Right,
			data: {
				filter: '',
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: UtilObject.getPageLayouts() },
				],
				onClick: (item: any) => {
					commonStore.typeSet(item.uniqueKey);
					analytics.event('DefaultTypeChange', { objectType: item.uniqueKey, route: analytics.route.settings });
					this.forceUpdate();
				},
			}
		});
	};

	onName (e: any, v: string) {
		C.WorkspaceSetInfo(commonStore.space, { name: this.checkName(v) });
	};

	onSelect (icon: string) {
		if (!icon) {
			C.WorkspaceSetInfo(commonStore.space, { iconImage: '' });
		};
	};

	onUpload (objectId: string) {
		C.WorkspaceSetInfo(commonStore.space, { iconImage: objectId });
	};

	onDelete () {
		this.props.close(() => {
			Action.removeSpace(commonStore.space, 'Settings', (message: any) => {
				if (message.error.code) {
					this.setState({ error: message.error.description });
				};
			});
		});
	};

	onUpgrade () {
		const { membership } = authStore;

		if (membership.tier >= I.TierType.CoCreator) {
			Action.membershipUpgrade();
		} else {
			this.props.close(() => {
				popupStore.open('settings', { data: { page: 'membership' } });
			});
		};

		analytics.event('ClickUpgradePlanTooltip', { type: 'storage', route: analytics.route.settingsSpaceIndex });
	};

	onCopy () {
		const { cid, key } = this.state;
		if (!cid || !key) {
			return;
		};

		UtilCommon.copyToast('', UtilSpace.getInviteLink(cid, key), translate('toastInviteCopy'));
		analytics.event('ClickShareSpaceCopyLink');
	};

	onMoreLink () {
		const { getId } = this.props;
		const { cid, key } = this.state;

		UtilMenu.inviteContext({
			containerId: getId(),
			cid,
			key,
			onInviteRevoke: () => this.setInvite('', ''),
		});
	};

	checkName (v: string): string {
		if ([ 
			translate('defaultNameSpace'), 
			translate('defaultNamePage'),
		].includes(v)) {
			v = '';
		};
		return v;
	};

	getRequestCnt (): number {
		return UtilSpace.getParticipantsList([ I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]).length;
	};

	getSharedCnt (): number {
		return UtilSpace.getList().filter(it => it.isShared && UtilSpace.isMyOwner(it.targetSpaceId)).length;
	};

});

export default PopupSettingsSpaceIndex;

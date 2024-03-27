import * as React from 'react';
import { Icon, Title, Label, Input, IconObject, Button, ProgressBar, Error } from 'Component';
import { I, C, UtilObject, UtilMenu, UtilCommon, UtilFile, translate, Renderer, Preview, analytics, UtilDate, Action, UtilSpace, UtilData } from 'Lib';
import { observer } from 'mobx-react';
import { detailStore, menuStore, commonStore, authStore, dbStore } from 'Store';
import Constant from 'json/constant.json';
import Url from 'json/url.json';

interface State {
	error: string;
};

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PopupSettings, State> {

	refName: any = null;
	state = {
		error: '',
	};

	constructor (props: any) {
		super(props);

		this.onDashboard = this.onDashboard.bind(this);
		this.onType = this.onType.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onName = this.onName.bind(this);
		this.onDelete = this.onDelete.bind(this);
	};

	render () {
		const { onPage, onSpaceTypeTooltip } = this.props;
		const { error } = this.state;
		const { config, spaceStorage, isOnline } = commonStore;
		const { localUsage, bytesLimit } = spaceStorage;
		const spaces = dbStore.getSpaces();
		const { account, accountSpaceId } = authStore;
		const space = UtilSpace.getSpaceview();
		const home = UtilSpace.getDashboard();
		const type = dbStore.getTypeById(commonStore.type);
		const isOwner = UtilSpace.isOwner();
		const isShared = space.spaceAccessType == I.SpaceType.Shared;
		const requestCnt = this.getRequestCnt();
		const sharedCnt = spaces.filter(it => (it.spaceAccessType == I.SpaceType.Shared) && ((it.creator == UtilSpace.getParticipantId(it.targetSpaceId, account.id)) || !it.creator)).length;
		const canWrite = UtilSpace.canParticipantWrite();
		const canDelete = space.targetSpaceId != accountSpaceId;
		const isShareActive = UtilSpace.isShareActive();
		const usageCn = [ 'item' ];

		let bytesUsed = 0;
		let extend = null;
		let requestCaption = null;
		let canShare = isOwner && (space.spaceAccessType != I.SpaceType.Personal);
		let canMembers = !isOwner && isShared;

		const progressSegments = (spaces || []).map(space => {
			const object: any = commonStore.spaceStorage.spaces.find(it => it.spaceId == space.targetSpaceId) || {};
			const usage = Number(object.bytesUsage) || 0;

			bytesUsed += usage;
			return { name: space.name, caption: UtilFile.size(usage), percent: usage / bytesLimit, isActive: space.isActive };
		}).filter(it => it);
		const isRed = (bytesUsed / bytesLimit >= 0.9) || (localUsage > bytesLimit);

		if ((sharedCnt >= 3) && !isShared) {
			canShare = false;
			canMembers = false;
		};

		if (isRed) {
			usageCn.push('red');
			extend = <Label text={translate(`popupSettingsSpaceIndexRemoteStorageExtend`)} onClick={this.onExtend} className="extend" />;
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
							<Label className="small" text={translate('popupSettingsSpaceIndexSpaceNameLabel')} />
							<Input
								ref={ref => this.refName = ref}
								value={this.checkName(space.name)}
								onKeyUp={this.onName}
								placeholder={translate('defaultNamePage')}
								readonly={!canWrite}
							/>
						</div>

						<Label
							className="spaceAccessType"
							text={translate(`spaceAccessType${space.spaceAccessType}`)}
							onMouseEnter={onSpaceTypeTooltip}
							onMouseLeave={e => Preview.tooltipHide(false)}
						/>
					</div>
				</div>

				<div className="sections">
					{canShare || canMembers ? (
						<div className="section sectionSpaceShare">
							<Title text={translate(`popupSettingsSpaceShareTitle`)} />

							<div className="sectionContent">
								{canShare ? (
									<div 
										className={[ 'item', (isShareActive ? '' : 'disabled') ].join(' ')} 
										onClick={() => isShareActive ? onPage('spaceShare') : null}
									>
										<div className="sides">
											<div className="side left">
												<Title text={isShared ? translate('popupSettingsSpaceIndexShareManageTitle') : translate('popupSettingsSpaceIndexShareShareTitle')} />
												<Label text={isShared ? translate('popupSettingsSpaceIndexShareManageText') : translate('popupSettingsSpaceIndexShareShareText')} />
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
												<Label text={translate('popupSettingsSpaceIndexShareMembersText')} />
											</div>
											<div className="side right">
												<Icon className="arrow" />
											</div>
										</div>
									</div>
								) : ''}
							</div>
						</div>
					) : ''}

					{canWrite ? (
						<div className="section sectionSpaceManager">
							<Title text={translate(`popupSettingsSpaceIndexManageSpaceTitle`)} />
							<div className="sectionContent">

								<div className={usageCn.join(' ')}>
									<div className="sides alignTop">
										<div className="side left">
											<Title text={translate(`popupSettingsSpaceIndexRemoteStorageTitle`)} />
											<div className="storageLabel">
												<Label text={UtilCommon.sprintf(translate(`popupSettingsSpaceIndexStorageText`), UtilFile.size(bytesLimit))} />
												&nbsp;
												{extend}
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
								</div>

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
										<Label text={account.id} />
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

	componentWillUnmount(): void {
		menuStore.closeAll([ 'select', 'searchObject' ]);
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
					analytics.event('DefaultTypeChange', { objectType: item.uniqueKey, route: 'Settings' });
					this.forceUpdate();
				},
			}
		});
	};

	onExtend () {
		const { account } = authStore;
		const { bytesLimit } = commonStore.spaceStorage;
		const space = detailStore.get(Constant.subId.space, commonStore.space);
		const limit = String(UtilFile.size(bytesLimit)).replace(' ', '');

		if (!account || !space || !bytesLimit) {
			return;
		};

		let url = Url.extendStorage;

		url = url.replace(/\%25accountId\%25/g, account.id);
		url = url.replace(/\%25spaceName\%25/g, space.name);
		url = url.replace(/\%25storageLimit\%25/g, limit);

		Renderer.send('urlOpen', url);
		analytics.event('GetMoreSpace');
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
		Action.removeSpace(commonStore.space, 'Settings', (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			};
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

	getRequestCnt () {
		const subId = Constant.subId.participant;
		const statuses = [ I.ParticipantStatus.Joining ];
		const records = dbStore.getRecords(subId, '').map(id => detailStore.get(subId, id)).filter(it => statuses.includes(it.status));

		return records.length;
	};

	getSharedCnt () {
		const spaces = dbStore.getSpaces();
		const { account } = authStore;
		const shared = spaces.filter(it => (it.spaceAccessType == I.SpaceType.Shared) && ((it.creator == UtilSpace.getParticipantId(it.targetSpaceId, account.id)) || !it.creator));

		return shared.length
	};
});

export default PopupSettingsSpaceIndex;

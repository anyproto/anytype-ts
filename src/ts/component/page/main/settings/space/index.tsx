import * as React from 'react';
import { observer } from 'mobx-react';
import { Icon, Title, Label, Input, IconObject, Button, Error, ObjectName } from 'Component';
import { I, C, S, U, J, translate, Preview, analytics, Action, Storage, sidebar } from 'Lib';

interface State {
	error: string;
	cid: string;
	key: string;
};

const pageMainSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PageSettingsComponent, State> {

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
		this.onCopy = this.onCopy.bind(this);
		this.onMoreLink = this.onMoreLink.bind(this);
		this.onAdd = this.onAdd.bind(this);
	};

	render () {
		const { onPage, onSpaceTypeTooltip } = this.props;
		const { error } = this.state;
		const space = U.Space.getSpaceview();
		const home = U.Space.getDashboard();
		const type = S.Record.getTypeById(S.Common.type);
		const profile = U.Space.getProfile();

		const requestCnt = this.getRequestCnt();
		const sharedCnt = this.getSharedCnt();

		const isOwner = U.Space.isMyOwner();
		const canWrite = U.Space.canMyParticipantWrite();
		const isShareActive = U.Space.isShareActive();

		let requestCaption = null;
		let canShare = isOwner && !space.isPersonal;


		if ((sharedCnt >= profile.sharedSpacesLimit) && !space.isShared) {
			canShare = false;
		};

		if (requestCnt) {
			requestCaption = <Label text={U.Common.sprintf('%d %s', requestCnt, U.Common.plural(requestCnt, translate('pluralRequest')))} className="caption" />;
		};

		return (
			<React.Fragment>
				<div className="spaceHeader">
					<div className="iconWrapper">
						<IconObject
							id="spaceIcon"
							size={96}
							object={{ ...space, spaceId: S.Common.space }}
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
						onMouseEnter={isShareActive ? () => {} : e => {
							Preview.tooltipShow({ text: translate('popupSettingsSpaceShareGenerateInviteDisabled'), element: $(e.currentTarget) });
						}}
						onMouseLeave={e => Preview.tooltipHide(false)}
					>
						<Title text={translate(`popupSettingsSpaceShareTitle`)} />

						<div className="sectionContent">

							{space.isPersonal ? (
								<div className="item isDefault" onClick={this.onAdd}>
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

							{canShare && space.isShared ? (
								<div
									className={[ 'item', (isShareActive ? '' : 'disabled') ].join(' ')}
									onClick={() => isShareActive ? onPage('spaceShare') : null}
								>
									<div className="sides">
										<div className="side left">
											<Title text={translate('commonMembers')} />
											<Label text={translate('popupSettingsSpaceIndexShareMembersManageText')} />
										</div>
										<div className="side right">
											{requestCaption}
											<Icon className="arrow" />
										</div>
									</div>
								</div>
							) : ''}

							<div
								className="item"
								onClick={() => S.Popup.open('spaceInfo', {})}
							>
								<div className="sides">
									<div className="side left">
										<Title text={translate('popupSettingsSpaceIndexSpaceInfoTitle')} />
									</div>
									<div className="side right">
										<Icon className="arrow" />
									</div>
								</div>
							</div>
						</div>
					</div>

					{canWrite ? (
						<div className="section sectionSpaceManager">
							<Title text={translate(`popupSettingsSpaceIndexManageSpaceTitle`)} />
							<div className="sectionContent">

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

					<div className="buttons">
						<Button text={isOwner ? translate('commonDelete') : translate('commonLeaveSpace')} color="red" onClick={this.onDelete} />
					</div>

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
		S.Menu.closeAll([ 'select', 'searchObject' ]);
	};

	init () {
		const { cid, key } = this.state;
		const space = U.Space.getSpaceview();

		if (space.isShared && !cid && !key) {
			U.Space.getInvite(S.Common.space, (cid: string, key: string) => {
				if (cid && key) {
					this.setInvite(cid, key);
				};
			});
		};
	};

	setInvite (cid: string, key: string) {
		this.setState({ cid, key });
	};

	onDashboard () {
		U.Menu.dashboardSelect(`#${this.props.getId()} #empty-dashboard-select`);
	};

	onType (e: any) {
		const { getId } = this.props;

		S.Menu.open('typeSuggest', {
			element: `#${getId()} #defaultType`,
			horizontal: I.MenuDirection.Right,
			data: {
				filter: '',
				filters: [
					{ relationKey: 'recommendedLayout', condition: I.FilterCondition.In, value: U.Object.getPageLayouts() },
					{ relationKey: 'uniqueKey', condition: I.FilterCondition.NotEqual, value: J.Constant.typeKey.template },
				],
				onClick: (item: any) => {
					S.Common.typeSet(item.uniqueKey);
					analytics.event('DefaultTypeChange', { objectType: item.uniqueKey, route: analytics.route.settings });
					this.forceUpdate();
				},
			}
		});
	};

	onName (e: any, v: string) {
		C.WorkspaceSetInfo(S.Common.space, { name: this.checkName(v) });
	};

	onSelect (icon: string) {
		if (!icon) {
			C.WorkspaceSetInfo(S.Common.space, { iconImage: '' });
		};
	};

	onUpload (objectId: string) {
		C.WorkspaceSetInfo(S.Common.space, { iconImage: objectId });
	};

	onDelete () {
		Action.removeSpace(S.Common.space, 'Settings', (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			};
		});
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
			onInviteRevoke: () => this.setInvite('', ''),
		});
	};

	onAdd () {
		Action.createSpace(analytics.route.settingsSpaceIndex);
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
		return U.Space.getParticipantsList([ I.ParticipantStatus.Joining, I.ParticipantStatus.Removing ]).length;
	};

	getSharedCnt (): number {
		return U.Space.getList().filter(it => it.isShared && U.Space.isMyOwner(it.targetSpaceId)).length;
	};

});

export default pageMainSettingsSpaceIndex;

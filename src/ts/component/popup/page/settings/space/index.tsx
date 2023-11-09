import * as React from 'react';
import { Icon, Title, Label, Input, IconObject, Button, ProgressBar, Error } from 'Component';
import { I, C, UtilObject, UtilMenu, UtilCommon, UtilFile, translate, Renderer, Preview, analytics, UtilDate, Action, Storage } from 'Lib';
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
		const { localUsage, bytesLimit } = commonStore.spaceStorage;
		const spaces = dbStore.getSpaces();
		const { account, accountSpaceId } = authStore;
		const space = UtilObject.getSpaceview();
		const home = UtilObject.getSpaceDashboard();
		const type = dbStore.getTypeById(commonStore.type);

		const usageCn = [ 'item' ];
		const canDelete = space.targetSpaceId != accountSpaceId;

		let bytesUsed = 0;
		let extend = null;
		let createdDate = null;

		const progressSegments = (spaces || []).map(space => {
			const object: any = commonStore.spaceStorage.spaces.find(it => it.spaceId == space.targetSpaceId) || {};
			const usage = Number(object.bytesUsage) || 0;

			bytesUsed += usage;
			return { name: space.name, caption: UtilFile.size(usage), percent: usage / bytesLimit, isActive: space.isActive };
		}).filter(it => it);
		const isRed = (bytesUsed / bytesLimit >= 0.9) || (localUsage > bytesLimit);

		if (isRed) {
			usageCn.push('red');
			extend = <Label text={translate(`popupSettingsSpaceIndexRemoteStorageExtend`)} onClick={this.onExtend} className="extend" />;
		};

		// old accounts don't have space creation date
		if (space.createdDate) {
			createdDate = (
				<div className="item">
					<div className="sides">
						<div className="side left">
							<Title text={translate(`popupSettingsSpaceIndexCreationDateTitle`)} />
							<Label text={UtilDate.date(UtilDate.dateFormat(I.DateFormat.MonthAbbrBeforeDay), space.createdDate)} />
						</div>
					</div>
				</div>
			);
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
							canEdit={true}
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
								placeholder={UtilObject.defaultName('Page')}
							/>

						</div>

						<Label
							className="spaceType"
							text={translate(`spaceType${space.spaceType}`)}
							onMouseEnter={onSpaceTypeTooltip}
							onMouseLeave={e => Preview.tooltipHide(false)}
						/>
					</div>
				</div>

				<div className="sections">
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
										<Button onClick={() => onPage('spaceStorageManager')} text={translate('popupSettingsSpaceIndexStorageManageFiles')} color="blank" className="c28" />
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

					<div className="section sectionIntegrations">
						<Title text={translate(`popupSettingsSpaceIndexIntegrations`)} />
						<div className="sectionContent">

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
								onClick={() => UtilCommon.copyToast(translate(`popupSettingsSpaceIndexSpaceIdTitle`), space.id)}
							>
								<div className="sides">
									<div className="side left">
										<Title text={translate(`popupSettingsSpaceIndexSpaceIdTitle`)} />
										<Label text={space.id} />
									</div>
									<div className="side right">
										<Icon className="copy" />
									</div>
								</div>
							</div>

							<div 
								className="item" 
								onClick={() => UtilCommon.copyToast(translate('popupSettingsAccountAnytypeIdentityAccountId'), account.id)}
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

							{createdDate}
						</div>
					</div>

					{canDelete ? (
						<div className="buttons">
							<Button text={translate('commonDelete')} color="red c36" onClick={this.onDelete} />
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

	onUpload (hash: string) {
		C.WorkspaceSetInfo(commonStore.space, { iconImage: hash });
	};

	onDelete () {
		Action.removeSpace(commonStore.space, 'Settings', (message: any) => {
			if (message.error.code) {
				this.setState({ error: message.error.description });
			};
		});
	};

	checkName (v: string): string {
		if ([ UtilObject.defaultName('Space'), UtilObject.defaultName('Page') ].includes(v)) {
			v = '';
		};
		return v;
	};

});

export default PopupSettingsSpaceIndex;

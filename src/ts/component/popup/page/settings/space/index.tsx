import * as React from 'react';
import { Icon, Title, Label, Input, IconObject, Button, ProgressBar } from 'Component';
import { UtilObject, UtilMenu, UtilCommon, UtilData, UtilFile, I, translate, Renderer, Preview, analytics } from 'Lib';
import { observer } from 'mobx-react';
import { detailStore, menuStore, commonStore, authStore } from 'Store';
import Constant from 'json/constant.json';
import Url from 'json/url.json';

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PopupSettings> {

	refName: any = null;
	dashboardId = '';

	constructor (props: any) {
		super(props);

		this.onDashboard = this.onDashboard.bind(this);
		this.onSelect = this.onSelect.bind(this);
		this.onUpload = this.onUpload.bind(this);
		this.onName = this.onName.bind(this);
	};

	render () {
		const { onPage } = this.props;
		const { localUsage, bytesUsed, bytesLimit } = commonStore.spaceStorage;
		const { account } = authStore;
		const space = UtilObject.getSpace();
		const name = this.checkName(space.name);
		const home = UtilObject.getSpaceDashboard();

		const percentageUsed = Math.floor(UtilCommon.getPercent(bytesUsed, bytesLimit));
		const currentUsage = String(UtilFile.size(bytesUsed));
		const limitUsage = String(UtilFile.size(bytesLimit));
		const isRed = (percentageUsed >= 90) || (localUsage > bytesLimit);
		const usageCn = [ 'item' ];

		let extend = null;
		let createdDate = null;

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
							<Label text={UtilCommon.date(UtilData.dateFormat(I.DateFormat.Short), space.createdDate)} />
						</div>
					</div>
				</div>
			);
		};

		return (
			<React.Fragment>

				<div className="spaceSettingsIndexHeader">
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
								value={name}
								onKeyUp={this.onName}
								placeholder={UtilObject.defaultName('Page')}
							/>

						</div>

						<Label
							className="spaceType"
							text={translate('popupSettingsSpaceIndexSpaceTypePersonal')}
							onMouseEnter={this.onSpaceTypeTooltip}
							onMouseLeave={e => Preview.tooltipHide(false)}
						/>
					</div>
				</div>

				<div className="sections">
					<div className="section sectionSpaceManager">
						<Title text={translate(`popupSettingsSpaceIndexManageSpaceTitle`)} />
						<div className="sectionContent">

							<div className={usageCn.join(' ')}>
								<div className="sides">
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

								<ProgressBar percent={percentageUsed} current={currentUsage} max={limitUsage} />
							</div>

							<div className="item">
								<div className="sides">
									<div className="side left">
										<Title text={translate(`commonHomepage`)} />
										<Label text={translate(`popupSettingsSpaceIndexHomepageDescription`)} />
									</div>
									<div className="side right">
										<div onClick={this.onDashboard} id="dashboard" className="button blank c28">
											<div className="txt">{home ? home.name : 'Select'}</div>
											<Icon className="arrow down" />
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
										<Icon className="import" />
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
										<Icon className="export" />
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
				</div>

			</React.Fragment>
		);
	};

	componentWillUnmount(): void {
		menuStore.closeAll([ 'select', 'searchObject' ]);	
	};

	onSelect (icon: string) {
		UtilObject.setIcon(commonStore.workspace, icon, '');
	};

	onUpload (hash: string) {
		UtilObject.setIcon(commonStore.workspace, '', hash);
	};

	onDashboard () {
		UtilMenu.dashboardSelect(`#${this.props.getId()} #dashboard`);
	};

	onExtend () {
		const { account } = authStore;
		const { bytesLimit } = commonStore.spaceStorage;
		const space = detailStore.get(Constant.subId.space, commonStore.workspace);
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
		UtilObject.setName(commonStore.workspace, this.checkName(v));
	};

	onSpaceTypeTooltip (e) {
		Preview.tooltipShow({
			title: translate('popupSettingsSpaceIndexSpaceTypePersonalTooltipTitle'),
			text: translate('popupSettingsSpaceIndexSpaceTypePersonalTooltipText'),
			className: 'big',
			element: $(e.currentTarget),
			typeY: I.MenuDirection.Bottom,
			typeX: I.MenuDirection.Left
		});
	};

	checkName (v: string): string {
		if ((v == UtilObject.defaultName('Space')) || (v == UtilObject.defaultName('Page'))) {
			v = '';
		};
		return v;
	};

});

export default PopupSettingsSpaceIndex;

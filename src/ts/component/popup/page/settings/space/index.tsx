import * as React from 'react';
import { Icon, Title, Label, Input, IconObject, Button, ProgressBar } from 'Component';
import { C, ObjectUtil, DataUtil, I, translate, Util, FileUtil, Renderer } from 'Lib';
import { observer } from 'mobx-react';
import { detailStore, menuStore, commonStore, authStore } from 'Store';
import Constant from 'json/constant.json';
import Url from 'json/url.json';

const PopupSettingsSpaceIndex = observer(class PopupSettingsSpaceIndex extends React.Component<I.PopupSettings> {

	refName: any = null;
	refDescription: any = null;
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
		const { bytesUsed, bytesLimit, localUsage } = commonStore.spaceStorage;
		const subId = Constant.subId.space;
		const space = detailStore.get(subId, commonStore.workspace);
		const name = this.checkName(space.name);
		const home = ObjectUtil.getSpaceDashboard();

		const percentageUsed = Math.floor(Util.getPercent(bytesUsed, bytesLimit));
		const currentUsage = String(FileUtil.size(bytesUsed));
		const limitUsage = String(FileUtil.size(bytesLimit));
		const isRed = percentageUsed >= 90;

		let extend = null;
		if (isRed) {
			extend = <Label text="Get more space." onClick={this.onExtend} className="extend" />;
		};

		console.log('SPACE: ', space)

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
							<Input
								ref={ref => this.refName = ref}
								value={name}
								onKeyUp={this.onName}
								placeholder={ObjectUtil.defaultName('Page')}
							/>
						</div>

						<div className="description">
							<Input
								ref={ref => this.refDescription = ref}
								value={''}
								placeholder={'Add a few words about the space...'}
							/>
						</div>

						<div className="spaceType">Personal</div>
					</div>
				</div>

				<div className="sections">
					<div className="section sectionSpaceManager">
						<Title text={'Manage Space'} />
						<div className="sectionContent">

							<div className="item">
								<div className="sides">
									<div className="side left">
										<Title text={'Remote storage'} />
										<div className="storageLabel">
											<Label text={Util.sprintf(translate(`popupSettingsStorageIndexText`), FileUtil.size(bytesLimit))} />
											&nbsp;
											{extend}
										</div>
									</div>
									<div className="side right">
										<Button onClick={() => onPage('storageManager')} text={translate('popupSettingsStorageIndexManageFiles')} color="blank" className="c28" />
									</div>
								</div>

								<ProgressBar percent={percentageUsed} current={currentUsage} max={limitUsage} />
							</div>

							<div className="item">
								<div className="sides">
									<div className="side left">
										<Title text={'Homepage'} />
										<Label text={'Select an object to set as your homepage'} />
									</div>
									<div className="side right">
										<div onClick={this.onDashboard} id="dashboard" className="button blank c28 dashboardSelect">
											{home ? home.name : 'Select'}
											<Icon className="arrow down" />
										</div>
									</div>
								</div>
							</div>

						</div>
					</div>

					<div className="section sectionIntegrations">
						<Title text={'Integrations'} />
						<div className="sectionContent">

							<div className="item" onClick={() => onPage('importIndex')}>
								<div className="sides">
									<div className="side left">
										<Icon className="import" />
										<Title text={'Import data'} />
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
										<Title text={'Export data'} />
									</div>
									<div className="side right">
										<Icon className="arrow" />
									</div>
								</div>
							</div>

						</div>
					</div>

					<div className="section sectionInfo">
						<Title text={'Space information'} />
						<div className="sectionContent">

							<div className="item itemSpaceId">
								<div className="sides">
									<div className="side left">
										<Title text={'Space ID'} />
										<Label text={space.id} />
									</div>
									<div className="side right">
										<Icon className="copy" />
									</div>
								</div>
							</div>

							<div className="item">
								<div className="sides">
									<div className="side left">
										<Title text={'Creation date'} />
									</div>
								</div>
							</div>

						</div>
					</div>
				</div>

			</React.Fragment>
		);
	};

	onSelect (icon: string) {
		ObjectUtil.setIcon(commonStore.workspace, icon, '');
	};

	onUpload (hash: string) {
		ObjectUtil.setIcon(commonStore.workspace, '', hash);
	};

	onDashboard () {
		const { getId } = this.props;
		const { workspace } = commonStore;
		const skipTypes = ObjectUtil.getFileTypes().concat(ObjectUtil.getSystemTypes());

		menuStore.open('searchObject', {
			element: `#${getId()} #dashboard`,
			horizontal: I.MenuDirection.Right,
			data: {
				filters: [
					{ operator: I.FilterOperator.And, relationKey: 'type', condition: I.FilterCondition.NotIn, value: skipTypes },
				],
				canAdd: true,
				dataChange: (items: any[]) => {
					const fixed: any[] = [ ObjectUtil.graph() ];
					return !items.length ? fixed : fixed.concat([ { isDiv: true } ]).concat(items);
				},
				onSelect: (el: any) => {
					C.ObjectWorkspaceSetDashboard(workspace, el.id, (message: any) => {
						if (message.error.code) {
							return;
						};

						detailStore.update(Constant.subId.space, { id: workspace, details: { spaceDashboardId: el.id } }, false);
						detailStore.update(Constant.subId.space, { id: el.id, details: el }, false);

						ObjectUtil.openHome('route');
					});
				}
			}
		});
	};

	onExtend () {
		const { account } = authStore;
		const space = detailStore.get(Constant.subId.space, commonStore.workspace);

		if (!account || !space) {
			return;
		};

		let url = Url.extendStorage;

		url = url.replace(/\%25accountId\%25/g, account.id);
		url = url.replace(/\%25spaceName\%25/g, space.name);

		Renderer.send('urlOpen', url);
	};

	onName (e: any, v: string) {
		ObjectUtil.setName(commonStore.workspace, this.checkName(v));
	};

	checkName (v: string): string {
		if ((v == ObjectUtil.defaultName('Space')) || (v == ObjectUtil.defaultName('Page'))) {
			v = '';
		};
		return v;
	};

});

export default PopupSettingsSpaceIndex;